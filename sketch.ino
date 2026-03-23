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

const int DEAD_BAND = 2;
int lastSentValue = -999;

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to Wokwi-GUEST!");
}

void loop() {

  int rawValue     = analogRead(sensorPin);
  int emissionsData = map(rawValue, 0, 4095, 50, 150);

  Serial.print("Current Emissions: ");
  Serial.print(emissionsData);
  Serial.println(" ppm");

  if (abs(emissionsData - lastSentValue) < DEAD_BAND) {
    delay(200);
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = firebaseUrl + "emissions/" + teamName + ".json";

    http.begin(url);
    http.setTimeout(4000);  // 4 s max per request
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"emissions\": " + String(emissionsData) + "}";

    int httpResponseCode = http.PUT(payload);

    if (httpResponseCode > 0) {
      Serial.print("Firebase Synced! Code: ");
      Serial.println(httpResponseCode);
      lastSentValue = emissionsData;  // update only on success

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
  delay(200);
}