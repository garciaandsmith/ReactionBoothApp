export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          ReactionBooth — Capture real reactions, effortlessly.
        </p>
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
