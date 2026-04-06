"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Fix default marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AktionMapProps {
  aktionen: {
    id: string;
    titel: string;
    datum: string;
    startzeit: string;
    endzeit: string;
    adresse: string;
    latitude: number | null;
    longitude: number | null;
    wahlkreis: { nummer: number; name: string };
    ansprechpersonName: string;
    _count: { anmeldungen: number };
    maxTeilnehmer: number | null;
  }[];
  onSelect: (id: string) => void;
}

function FitBounds({ aktionen }: { aktionen: AktionMapProps["aktionen"] }) {
  const map = useMap();

  useEffect(() => {
    const validAktionen = aktionen.filter((a) => a.latitude && a.longitude);
    if (validAktionen.length > 0) {
      const bounds = L.latLngBounds(
        validAktionen.map((a) => [a.latitude!, a.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [aktionen, map]);

  return null;
}

export default function AktionMap({ aktionen, onSelect }: AktionMapProps) {
  const geoAktionen = aktionen.filter((a) => a.latitude && a.longitude);

  return (
    <div className="h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[52.5235, 13.4115]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds aktionen={geoAktionen} />

        {geoAktionen.map((aktion) => (
          <Marker
            key={aktion.id}
            position={[aktion.latitude!, aktion.longitude!]}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-tanne mb-1">{aktion.titel}</h3>
                <p className="text-sm text-gray-600">
                  📅 {format(new Date(aktion.datum), "d. MMMM yyyy", { locale: de })}
                </p>
                <p className="text-sm text-gray-600">
                  🕐 {aktion.startzeit} – {aktion.endzeit} Uhr
                </p>
                <p className="text-sm text-gray-600">📍 {aktion.adresse}</p>
                <p className="text-sm text-gray-600">
                  WK {aktion.wahlkreis.nummer} · 👤 {aktion.ansprechpersonName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {aktion._count.anmeldungen} Anmeldung{aktion._count.anmeldungen !== 1 ? "en" : ""}
                  {aktion.maxTeilnehmer ? ` / ${aktion.maxTeilnehmer}` : ""}
                </p>
                <button
                  onClick={() => onSelect(aktion.id)}
                  className="mt-2 text-sm bg-tanne text-white px-3 py-1 rounded font-bold hover:bg-tanne-light"
                >
                  Anmelden
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
