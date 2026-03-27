// ═══════════════════════════════════════════════════════════════════════
//  ChainReaction — ESP32 IoT Edge Device (Layer 1)
// ═══════════════════════════════════════════════════════════════════════
//  This Arduino sketch runs on a simulated ESP32 microcontroller inside
//  the Wokwi online simulator.  It reads a potentiometer (acting as a
//  CO₂ sensor), converts the raw analog value to a realistic 50–150 ppm
//  range, and pushes the reading to Firebase Realtime Database via HTTP.
//
//  The web dashboard (index.html) subscribes to the same Firebase path
//  in real time, so sensor updates appear on screen instantly.
// ═══════════════════════════════════════════════════════════════════════

#include <WiFi.h>        // ESP32 WiFi library — lets us connect to the internet
#include <HTTPClient.h>  // HTTP client — lets us send PUT requests to Firebase

// ── WiFi credentials ───────────────────────────────────────────────────
// Wokwi provides a virtual WiFi network called "Wokwi-GUEST" with no
// password.  Real hardware would use your actual WiFi SSID and password.
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ── Team / Device identity ─────────────────────────────────────────────
// This string MUST exactly match the "Device ID" you type into the web
// dashboard.  Firebase stores emissions at the path "emissions/<teamName>",
// so both the ESP32 and the dashboard need to agree on the same name.
String teamName = "ratpoison";

// ── Firebase Realtime Database URL ─────────────────────────────────────
// Must end with "/" — the ESP32 appends "emissions/<teamName>.json" to
// form the full REST endpoint for a PUT request.
String firebaseUrl = "https://chainreaction-iot-default-rtdb.asia-southeast1.firebasedatabase.app/";

// ── Hardware pin assignments ───────────────────────────────────────────
// Pin 34: Analog input — reads the potentiometer's voltage (0–3.3 V)
// Pin  2: Digital output — built-in LED, blinks briefly on each sync
const int sensorPin = 34;
const int ledPin    = 2;

// ── Dead-band filter ───────────────────────────────────────────────────
// Without this filter, tiny random fluctuations would cause the ESP32 to
// flood Firebase with near-identical readings dozens of times per second.
// DEAD_BAND = 2 means we only push a new value when the reading changes
// by more than ±2 ppm compared to the last successfully sent value.
const int DEAD_BAND = 2;
int lastSentValue = -999; // Initialised far from any real reading

// ═══════════════════════════════════════════════════════════════════════
//  setup() — Runs once when the ESP32 boots
// ═══════════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);       // Start serial monitor at 115200 baud
  pinMode(ledPin, OUTPUT);    // Configure the LED pin as an output

  // Connect to WiFi — keep retrying until the connection is established
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to Wokwi-GUEST!");
}

// ═══════════════════════════════════════════════════════════════════════
//  loop() — Runs continuously after setup()
// ═══════════════════════════════════════════════════════════════════════
//  Each iteration:
//    1. Reads the potentiometer's raw 12-bit ADC value (0–4095)
//    2. Maps it to a realistic 50–150 ppm emissions range
//    3. Checks the dead-band filter to avoid redundant uploads
//    4. If the reading has changed enough, sends it to Firebase via PUT
//    5. Blinks the LED to give visual feedback of a successful sync
// ═══════════════════════════════════════════════════════════════════════
void loop() {

  // 1. Read the analog sensor (potentiometer wired to pin 34)
  //    The ESP32 has a 12-bit ADC, so values range from 0 to 4095.
  int rawValue     = analogRead(sensorPin);

  // 2. Map the raw ADC range to our simulated emissions range (50–150 ppm)
  //    This makes the potentiometer slider feel like a real CO₂ sensor.
  int emissionsData = map(rawValue, 0, 4095, 50, 150);

  // Print the current reading to the serial monitor for debugging
  Serial.print("Current Emissions: ");
  Serial.print(emissionsData);
  Serial.println(" ppm");

  // 3. Dead-band filter: skip the upload if the reading hasn't changed
  //    enough since the last successful send (prevents Firebase flooding)
  if (abs(emissionsData - lastSentValue) < DEAD_BAND) {
    delay(200);   // Small delay to avoid hammering the CPU
    return;       // Skip the rest of this loop iteration
  }

  // 4. Send the new reading to Firebase via an HTTP PUT request
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Build the Firebase REST URL:  <baseURL>/emissions/<teamName>.json
    String url = firebaseUrl + "emissions/" + teamName + ".json";

    http.begin(url);
    http.setTimeout(4000);  // Abort the request if it takes longer than 4 s
    http.addHeader("Content-Type", "application/json");

    // The JSON payload the dashboard will receive via its WebSocket listener
    String payload = "{\"emissions\": " + String(emissionsData) + "}";

    // PUT replaces the entire node at this path in Firebase
    int httpResponseCode = http.PUT(payload);

    if (httpResponseCode > 0) {
      // Successful HTTP response — log and update the sent-value tracker
      Serial.print("Firebase Synced! Code: ");
      Serial.println(httpResponseCode);
      lastSentValue = emissionsData;  // Update only on success

      // 5. Quick LED blink (80 ms) to visually confirm syncing
      digitalWrite(ledPin, HIGH);
      unsigned long blinkStart = millis();
      while (millis() - blinkStart < 80) { /* spin-wait for 80 ms */ }
      digitalWrite(ledPin, LOW);

    } else {
      // HTTP error — log the negative error code for debugging
      Serial.print("Firebase error: ");
      Serial.println(httpResponseCode);
    }

    http.end();  // Release the HTTP connection resources
  }

  delay(200);    // Run the loop roughly 5 times per second
}