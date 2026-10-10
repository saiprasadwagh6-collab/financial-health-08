import React from 'react';

interface ArthDrishtiLogoProps {
  variant?: 'sidebar' | 'light' | 'dark' | 'compact';
  className?: string;
  showTagline?: boolean;
  customLogoSrc?: string;
}

export const ArthDrishtiLogo: React.FC<ArthDrishtiLogoProps> = ({
  variant = 'sidebar',
  className = '',
  showTagline = true,
  customLogoSrc,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // If a custom transparent image URL is explicitly passed or standard transparent logo file exists
  const activeImgSrc = customLogoSrc || (imageError ? null : '/arthdrishti-logo.png');

  // Color configuration based on background context:
  // For 'sidebar' (dark teal gradient): "ARTH" is crisp luminous metallic white/platinum, "DRISHTI" is rich gold
  // For 'light' (ivory/cream pages): "ARTH" is carbon metallic black (#111827), "DRISHTI" is rich bullion gold
  const isDarkBg = variant === 'sidebar' || variant === 'dark';

  const arthFill = isDarkBg ? 'url(#arthLightMetallic)' : 'url(#arthDarkMetallic)';
  const drishtiFill = 'url(#arthGoldMetallic)';
  const taglineFill = isDarkBg ? '#E7C878' : '#A9822F';
  const dividerStroke = isDarkBg ? 'url(#goldDividerGradient)' : '#C99E3D';

  // If custom transparent logo file is present and loaded without error:
  if (activeImgSrc && !imageError) {
    return (
      <div className={`flex flex-col select-none ${className}`}>
        <img
          src={activeImgSrc}
          alt="ArthDrishti"
          className="w-full h-auto object-contain max-h-16"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <svg
        viewBox="0 0 540 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-full overflow-visible"
        style={{ filter: isDarkBg ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' : 'none' }}
      >
        <defs>
          {/* Radiant Bullion Gold Metallic Gradient */}
          <linearGradient id="arthGoldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E29B" />
            <stop offset="25%" stopColor="#DFB757" />
            <stop offset="50%" stopColor="#FFF2B8" />
            <stop offset="75%" stopColor="#B88924" />
            <stop offset="100%" stopColor="#E9C96E" />
          </linearGradient>

          {/* Platinum / Metallic White for Dark Backgrounds */}
          <linearGradient id="arthLightMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F1F5F9" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Carbon Black Metallic for Light Backgrounds */}
          <linearGradient id="arthDarkMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="40%" stopColor="#0F172A" />
            <stop offset="75%" stopColor="#1E1E24" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Golden Triangle Inset Inside 'A' */}
          <linearGradient id="goldTriangleGradient" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#9C731A" />
            <stop offset="40%" stopColor="#E5BE5E" />
            <stop offset="70%" stopColor="#FFEAA5" />
            <stop offset="100%" stopColor="#F3CD6E" />
          </linearGradient>

          {/* Gold Divider Line Gradient */}
          <linearGradient id="goldDividerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9B45B" stopOpacity="0.1" />
            <stop offset="30%" stopColor="#F3D58A" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#D9B45B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D9B45B" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* ============================================================== */}
        {/* WORDMARK: ARTH DRISHTI                                         */}
        {/* ============================================================== */}
        <g id="brand-wordmark" transform="translate(4, 5)">
          {/* --- LETTER 'A' with Golden Inset Triangle --- */}
          <g id="letter-A">
            {/* Outer A Silhouette */}
            <path
              d="M32 4L62 68H45L38 52H24L17 68H0L30 4H32Z"
              fill={arthFill}
            />
            {/* Signature Golden Triangle Centerpiece */}
            <polygon
              points="31,23 21.5,45 40.5,45"
              fill="url(#goldTriangleGradient)"
              stroke="#D4AF37"
              strokeWidth="0.75"
            />
          </g>

          {/* --- LETTER 'R' --- */}
          <path
            id="letter-R"
            d="M66 4H96C105 4 112 10.5 112 19.5C112 26.5 107 32 100 34L113 68H97L86 36H80V68H66V4ZM80 16V25H94C97.5 25 100 23 100 20.5C100 18 97.5 16 94 16H80Z"
            fill={arthFill}
          />

          {/* --- LETTER 'T' --- */}
          <path
            id="letter-T"
            d="M117 4H157V16H144V68H130V16H117V4Z"
            fill={arthFill}
          />

          {/* --- LETTER 'H' --- */}
          <path
            id="letter-H"
            d="M162 4H176V30H198V4H212V68H198V42H176V68H162V4Z"
            fill={arthFill}
          />

          {/* --- LETTER 'D' (Gold) --- */}
          <path
            id="letter-D"
            d="M217 4H244C258 4 268 14 268 28V44C268 58 258 68 244 68H217V4ZM231 16V56H242C250.5 56 254 49 254 41V31C254 23 250.5 16 242 16H231Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'R' (Gold) --- */}
          <path
            id="letter-R2"
            d="M273 4H303C312 4 319 10.5 319 19.5C319 26.5 314 32 307 34L320 68H304L293 36H287V68H273V4ZM287 16V25H301C304.5 25 307 23 307 20.5C307 18 304.5 16 301 16H287Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'I' (Gold) --- */}
          <path
            id="letter-I1"
            d="M325 4H339V68H325V4Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'S' (Gold) --- */}
          <path
            id="letter-S"
            d="M345 52C346.5 61.5 354 68 365 68C376 68 384 61.5 384 52C384 43 378 39 366 36C353 32.5 347 28 347 20C347 11 354 4 365 4C375.5 4 382.5 10 383.5 19H370C369.5 14.5 365.5 11.5 360.5 11.5C355.5 11.5 352 14.5 352 19C352 23 355 25.5 364 28C377 31.5 389 36 389 48C389 59.5 379.5 68 365 68C351 68 340 59 339 48L345 52Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'H' (Gold) --- */}
          <path
            id="letter-H2"
            d="M394 4H408V30H430V4H444V68H430V42H408V68H394V4Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'T' (Gold) --- */}
          <path
            id="letter-T2"
            d="M449 4H489V16H476V68H462V16H449V4Z"
            fill={drishtiFill}
          />

          {/* --- LETTER 'I' (Gold) --- */}
          <path
            id="letter-I2"
            d="M494 4H508V68H494V4Z"
            fill={drishtiFill}
          />
        </g>

        {/* ============================================================== */}
        {/* SUBTITLE & GOLD ACCENT DIVIDERS:                               */}
        {/* — Because Every Rupee Shapes Your Tomorrow. —                  */}
        {/* ============================================================== */}
        {showTagline && (
          <g id="brand-tagline" transform="translate(0, 80)">
            {/* Left Accent Rule with End Diamond */}
            <line x1="8" y1="12" x2="48" y2="12" stroke={dividerStroke} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="50,12 52.5,10 55,12 52.5,14" fill={taglineFill} />

            {/* Tagline Text */}
            <text
              x="266"
              y="16"
              textAnchor="middle"
              fill={taglineFill}
              fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
              fontSize="12.5"
              fontWeight="600"
              letterSpacing="1.2"
              className="tracking-wider uppercase"
            >
              Because Every Rupee Shapes Your Tomorrow.
            </text>

            {/* Right Accent Rule with End Diamond */}
            <polygon points="477,12 479.5,10 482,12 479.5,14" fill={taglineFill} />
            <line x1="484" y1="12" x2="524" y2="12" stroke={dividerStroke} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
