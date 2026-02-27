interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold text-[15px] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-[#66BB6A] to-[#26A69A] text-white hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(58,141,123,0.3)] active:translate-y-0",
    outline:
      "bg-transparent border border-[rgba(0,0,0,0.15)] text-[#1A2332] hover:border-[rgba(0,0,0,0.3)] hover:-translate-y-0.5",
    ghost:
      "bg-transparent text-[#3A8D7B] hover:text-[#2D6B5F] px-0 py-0",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
