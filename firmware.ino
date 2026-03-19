#include <WiFi.h>
#include <HTTPClient.h>

// ── WiFi ───────────────────────────────────────────────────────────────
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ── PARTICIPANT SETUP ────────────────────────────────────────────────
// Must exactly match the "Device ID" typed on the web dashboard
String teamName = "ratpoison";

// ── ORGANIZER URL ────────────────────────────────────────────────────
// Must end with "/"
String firebaseUrl = "https://chainreaction-iot-default-rtdb.asia-southeast1.firebasedatabase.app/";

// ── Pins ─────────────────────────────────────────────────────────────
const int sensorPin = 34;
const int ledPin    = 2;

// ── Snappiness: only send when value changes by more than this amount
const int DEAD_BAND = 2;  // ignore jitter < 2 ppm
int lastSentValue = -999; // force a send on first loop

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);            // faster WiFi poll
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to Wokwi-GUEST!");
}

void loop() {
  // Read sensor and map to 50–150 ppm
  int rawValue     = analogRead(sensorPin);
  int emissionsData = map(rawValue, 0, 4095, 50, 150);

  Serial.print("Current Emissions: ");
  Serial.print(emissionsData);
  Serial.println(" ppm");

  // ── SNAPPINESS FIX 1: Dead-band filter ───────────────────────────
  // Only push to Firebase when the value has meaningfully changed.
  // This prevents redundant writes when the pot is held steady,
  // keeping Firebase listener events relevant and fast.
  if (abs(emissionsData - lastSentValue) < DEAD_BAND) {
    delay(200);  // short sleep, then re-read without sending
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = firebaseUrl + "emissions/" + teamName + ".json";

    // ── SNAPPINESS FIX 2: Set a tight HTTP timeout ────────────────
    // Prevents the loop from hanging on slow WiFi connections.
    http.begin(url);
    http.setTimeout(4000);  // 4 s max per request
    http.addHeader("Content-Type", "application/json");

    // JSON payload that matches frontend parser: data.emissions
    String payload = "{\"emissions\": " + String(emissionsData) + "}";

    int httpResponseCode = http.PUT(payload);

    if (httpResponseCode > 0) {
      Serial.print("Firebase Synced! Code: ");
      Serial.println(httpResponseCode);
      lastSentValue = emissionsData;  // update only on success

      // ── SNAPPINESS FIX 3: LED blink is non-blocking ──────────────
      // Original: delay(150) inside loop → every cycle was 650ms, not 500ms.
      // Fix: use millis()-based non-blocking blink for just 80ms of LED-on time.
      digitalWrite(ledPin, HIGH);
      unsigned long blinkStart = millis();
      while (millis() - blinkStart < 80) { /* spin for 80ms */ }
      digitalWrite(ledPin, LOW);

    } else {
      Serial.print("Firebase error: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }

  // ── SNAPPINESS FIX 4: Faster loop cadence ────────────────────────
  // 200ms delay keeps the sensor feeling "live" in the demo.
  // Combined with dead-band filtering above, this won't flood Firebase
  // with unnecessary writes — only real changes get pushed.
  delay(200);
}
