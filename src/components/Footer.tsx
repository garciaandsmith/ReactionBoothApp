import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-muted-gray py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/mascotsmile.svg"
            alt="ReactionBooth mascot"
            width={28}
            height={28}
            className="mascot-float"
          />
          <p className="text-sm text-gray-400">
            ReactionBooth — Capture real reactions, effortlessly.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
