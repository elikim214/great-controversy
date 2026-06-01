'use client';

interface Props {
  title: string;
  body: string;
  onDismiss?: () => void;
}

export default function PhaseMessage({ title, body, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onDismiss}>
      <div
        className="max-w-md w-full text-center px-8 py-10 animate-phase-reveal"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-serif text-3xl font-bold text-gold mb-4 text-balance">{title}</h2>
        <p className="text-foreground/80 text-lg leading-relaxed whitespace-pre-line">{body}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="btn btn-primary mt-6">
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
