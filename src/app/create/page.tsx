import CreateReactionForm from "@/components/CreateReactionForm";

export const metadata = {
  title: "Create a Reaction — ReactionBooth",
  description: "Send someone a video and capture their genuine reaction.",
};

export default function CreatePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Create a reaction
        </h1>
        <p className="text-gray-500">
          Paste a YouTube link, add the emails, and we&apos;ll handle the rest.
        </p>
      </div>
      <CreateReactionForm />
    </div>
  );
}
