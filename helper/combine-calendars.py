import requests
from ics import Calendar
import arrow

# Liste der Webcal-URLs und zugehörige Kategorien
calendars = {
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT7j9M3fHv1pOOHwLUuQsLR7": "meet friends",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT64OZl80qUsOO23PyaSk4SG": "holidays",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT4YzAWjiKzVjvcmKiMovTYIg5t1cOaYv9y0fkb5_M7duCyD17IUED4NbE-G3WhwZ2k": "family",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT4TsYJq_yMZFy7PlEUSbQy-I2v0lfG_ZbwI_4inrDO4iqv83Q0-5RnGmu21voiiFAk": "studium",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT7HHbZ_6_FFEg8WpEmelku-RFn-jio5uWDa1JtJIH_fLjxy2C8C29BviwukoNMndSU": "andere Termine",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT6mCxRADSZANyP3SJFDvc6WFXK1IzQO1qCKluvaERwHlyOlUckeJd4y7gLiZyay7FQ": "Geburtstage",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT7ciY0nak4zfbqohcMUSQox-F1bi40eZ_QwzBBx4OnUjebZ1YFxmW0VoPZN1TNJ4Zk": "arzt",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT5rR6SF8dzOQLD-cGNH4_-jf0n4SevNnFs2y4Ztg2dYlZCwN2-yKnIeUD0tJAwwgsI": "Verbindung",
    "webcal://p110-caldav.icloud.com/published/2/MTExMjU1Nzg2NTIxMTEyNc0NpoBBzDB_3O-5fAIlGT6Z5NrmBEbGyvdzH9yWg1_kjMDXfdmGQO9dQAEb_vXI_HhZbCSdtoh-sklWvTgvl0c": "Arbeit"
}

# Speicherort für die kombinierte Kalenderdatei
output_file = "calendar_combined.ics"  # Pfad anpassen

# Funktion zum Herunterladen und Kombinieren der Kalenderdaten
def download_and_combine_calendars():
    combined_calendar = Calendar()
    now = arrow.now()

    for url, category in calendars.items():
        # Ersetze webcal:// durch https://
        https_url = url.replace("webcal://", "https://")
        response = requests.get(https_url)
        if response.status_code == 200:
            try:
                calendar = Calendar(response.text)
            except Exception as e:
                print(f"Fehler beim Parsen des Kalenders von URL {https_url}: {e}")
                continue
            for event in calendar.events:
                # Filtere nur zukünftige Ereignisse
                if event.begin > now:
                    # Formatiere das Datum im gewünschten Format (z.B. DD/MM/YYYY)
                    event.begin = arrow.get(event.begin).format("DD/MM/YYYY HH:mm")
                    event.end = arrow.get(event.end).format("DD/MM/YYYY HH:mm")
                    
                    # Füge die Kategorie als Beschreibung hinzu
                    event.description = f"Category: {category}"
                    combined_calendar.events.add(event)
        else:
            print(f"Fehler beim Abrufen der URL: {https_url}")

    # Speichern der kombinierten Kalenderdatei
    with open(output_file, "w") as f:
        f.write(str(combined_calendar))

# Funktion wird ausgeführt
if __name__ == "__main__":
    download_and_combine_calendars()
    print(f"Kalender erfolgreich kombiniert und gespeichert: {output_file}")
