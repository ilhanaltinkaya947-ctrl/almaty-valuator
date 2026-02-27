import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-[#9CA3AF] tracking-wider uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-4 text-[#1A2332] placeholder:text-[#9CA3AF] transition-all duration-200 focus:border-[rgba(58,141,123,0.4)] focus:shadow-[0_0_0_3px_rgba(58,141,123,0.1)] focus:outline-none ${
              icon ? "pl-11" : ""
            } ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";
