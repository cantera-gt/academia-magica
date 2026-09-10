import type { ItemZone, CharacterGender } from "@/types/database";

/**
 * Fondo tipo "escena" para cada zona del cuarto (piso, pared, ventana / cielo).
 * A proposito NO dibuja muebles concretos (cama, escritorio, estanteria...)
 * porque esos son justamente los items que se compran en la tienda — si la
 * base ya los mostrara dibujados, se verian duplicados o el alumno pensaria
 * que ya los tiene. Esto es solo el "cascaron" del espacio.
 *
 * Si el alumno tiene un fondo comprado y equipado para esta zona
 * (backgroundImageUrl), se muestra esa imagen en vez de la escena SVG
 * generica de mas abajo.
 */
export default function RoomScene({
  zone,
  gender,
  backgroundImageUrl,
}: {
  zone: ItemZone;
  gender: CharacterGender;
  backgroundImageUrl?: string | null;
}) {
  if (backgroundImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={backgroundImageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full rounded-3xl object-cover"
      />
    );
  }
  if (zone === "jardin") return <GardenScene />;
  if (zone === "estudio") return <StudyScene />;
  return <BedroomScene gender={gender} />;
}

function BedroomScene({ gender }: { gender: CharacterGender }) {
  const wallTop = gender === "boy" ? "#dbeeff" : "#fbe4f0";
  const wallBottom = gender === "boy" ? "#cfe4fb" : "#f6d9ee";
  const rug = gender === "boy" ? "#8fc7f2" : "#f3a8cf";
  const rugRing = gender === "boy" ? "#5fa8e0" : "#e17fb0";

  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full rounded-3xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bedroomWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id="bedroomFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9c9a0" />
          <stop offset="100%" stopColor="#d8ac78" />
        </linearGradient>
        <linearGradient id="bedroomSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe4ff" />
          <stop offset="100%" stopColor="#e8f7ff" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="170" fill="url(#bedroomWall)" />
      <rect x="0" y="170" width="400" height="90" fill="url(#bedroomFloor)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 70 - 20} y1="170" x2={i * 70 + 40} y2="260" stroke="#c99a63" strokeWidth="1.5" opacity="0.45" />
      ))}

      <rect x="150" y="30" width="100" height="80" rx="10" fill="url(#bedroomSky)" stroke="#fff" strokeWidth="6" />
      <line x1="200" y1="30" x2="200" y2="110" stroke="#fff" strokeWidth="4" />
      <line x1="150" y1="70" x2="250" y2="70" stroke="#fff" strokeWidth="4" />
      <circle cx="222" cy="52" r="9" fill="#ffe27a" opacity="0.9" />

      <ellipse cx="200" cy="222" rx="110" ry="24" fill={rug} opacity="0.55" />
      <ellipse cx="200" cy="222" rx="80" ry="17" fill="none" stroke={rugRing} strokeWidth="3" opacity="0.5" />

      <line x1="60" y1="0" x2="60" y2="24" stroke="#d8b98a" strokeWidth="2" opacity="0.6" />
      <circle cx="60" cy="30" r="7" fill="#ffe9a8" opacity="0.85" />
    </svg>
  );
}

function StudyScene() {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full rounded-3xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="studyWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdeccb" />
          <stop offset="100%" stopColor="#f8dcaa" />
        </linearGradient>
        <linearGradient id="studyFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2b98a" />
          <stop offset="100%" stopColor="#c99863" />
        </linearGradient>
        <linearGradient id="studySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe7b0" />
          <stop offset="100%" stopColor="#fff6e2" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="170" fill="url(#studyWall)" />
      <rect x="0" y="170" width="400" height="90" fill="url(#studyFloor)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 70 - 20} y1="170" x2={i * 70 + 40} y2="260" stroke="#a97a45" strokeWidth="1.5" opacity="0.4" />
      ))}

      <rect x="40" y="26" width="90" height="72" rx="10" fill="url(#studySky)" stroke="#fff" strokeWidth="6" />
      <line x1="85" y1="26" x2="85" y2="98" stroke="#fff" strokeWidth="4" />
      <line x1="40" y1="62" x2="130" y2="62" stroke="#fff" strokeWidth="4" />

      <rect x="270" y="34" width="70" height="52" rx="6" fill="#fff" opacity="0.6" stroke="#d9b26f" strokeWidth="3" />
      <circle cx="288" cy="50" r="4" fill="#ff9fb1" />
      <circle cx="308" cy="46" r="4" fill="#93d3ff" />
      <circle cx="322" cy="58" r="4" fill="#ffd76a" />
    </svg>
  );
}

function GardenScene() {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full rounded-3xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe8ff" />
          <stop offset="100%" stopColor="#eaf9ee" />
        </linearGradient>
        <linearGradient id="gardenGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9bd97e" />
          <stop offset="100%" stopColor="#6fbf5a" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="150" fill="url(#gardenSky)" />
      <circle cx="345" cy="45" r="26" fill="#ffe27a" opacity="0.95" />
      <g opacity="0.85" fill="#fff">
        <ellipse cx="70" cy="55" rx="26" ry="14" />
        <ellipse cx="95" cy="50" rx="20" ry="12" />
        <ellipse cx="50" cy="50" rx="18" ry="11" />
      </g>
      <g opacity="0.7" fill="#fff">
        <ellipse cx="230" cy="35" rx="20" ry="10" />
        <ellipse cx="250" cy="32" rx="16" ry="9" />
      </g>

      <path d="M0,150 Q100,130 200,150 T400,150 L400,260 L0,260 Z" fill="url(#gardenGrass)" />
      <path d="M0,150 Q100,130 200,150 T400,150" fill="none" stroke="#5aa848" strokeWidth="3" opacity="0.6" />

      <g opacity="0.9">
        <ellipse cx="55" cy="235" rx="16" ry="10" fill="#5aa848" />
        <ellipse cx="345" cy="245" rx="20" ry="12" fill="#5aa848" />
      </g>
    </svg>
  );
}
