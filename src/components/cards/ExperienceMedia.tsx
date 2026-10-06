// Placeholder artwork until partner photos and video arrive through Cloudinary.
// Keeps the card layout and aspect ratios stable, so swapping in next/image is drop-in.

const gradients: Record<string, string> = {
  "Game drive": "from-[#c9a464] via-[#8a6a3a] to-[#3d5e34]",
  "Guided walk": "from-[#7c9a5a] via-[#4f6d3c] to-[#2c3d26]",
  "Cultural visit": "from-[#d9822b] via-[#a1461f] to-[#4a2416]",
  "Day trip": "from-[#e8c78a] via-[#b98a52] to-[#5f7f45]",
  Activity: "from-[#5fa3c2] via-[#2f6f8f] to-[#173c53]",
  Stay: "from-[#d8c38f] via-[#9c7a4e] to-[#4a3a28]",
};

export function ExperienceMedia({
  title,
  typeLabel,
  className = "",
}: {
  title: string;
  typeLabel: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${title} (photo coming soon)`}
      className={`relative overflow-hidden bg-gradient-to-br ${gradients[typeLabel] ?? gradients["Day trip"]} ${className}`}
    >
      <svg viewBox="0 0 120 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-40" aria-hidden>
        <path d="M0 60 L0 38 Q20 26 38 34 T72 30 Q92 20 120 32 L120 60 Z" fill="#0d1712" />
      </svg>
    </div>
  );
}
