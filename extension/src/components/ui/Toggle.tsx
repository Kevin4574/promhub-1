import type { HTMLAttributes } from "react"

export interface ToggleProps extends HTMLAttributes<HTMLButtonElement> {
	checked: boolean
	onChange: (checked: boolean) => void
	label?: string
}

export function Toggle({ checked, onChange, disabled, className = "", label, ...rest }: ToggleProps) {
	const handleClick = () => {
		if (disabled) {
			return
		}
		onChange(!checked)
	}

	const containerClasses = [
		"relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200",
		checked ? "bg-blue-500 border-blue-500" : "bg-gray-200 border-gray-200",
		disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
		className
	]
		.filter(Boolean)
		.join(" ")

	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			className={containerClasses}
			disabled={disabled}
			onClick={handleClick}
			{...rest}
		>
			<span
				className={`absolute left-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
					checked ? "translate-x-5" : "translate-x-0"
				}`}
			>
				<span className="sr-only">{label}</span>
			</span>
		</button>
	)
}
