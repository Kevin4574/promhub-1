import type { InputHTMLAttributes, ReactNode } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	labelSecondary?: ReactNode
	hint?: ReactNode
	error?: string
}

export function Input({
	label,
	labelSecondary,
	hint,
	error,
	className = "",
	...rest
}: InputProps) {
	const hasError = Boolean(error)
	const classes = [
		"w-full h-9 rounded-lg border px-3 text-sm transition-colors duration-150",
		hasError ? "border-red-400 bg-red-50 text-red-900 placeholder:text-red-400" : "border-gray-300 bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
	]
		.filter(Boolean)
		.join(" ")

	return (
		<label className="block w-full space-y-1.5">
			{label ? (
				<div className="flex items-center justify-between">
					<span className="text-xs font-medium text-gray-700">{label}</span>
					{labelSecondary ? <span className="text-[11px] text-blue-600">{labelSecondary}</span> : null}
				</div>
			) : null}
			<input className={`${classes} ${className}`} {...rest} />
			{hasError ? (
				<p className="text-[11px] text-red-600">{error}</p>
			) : hint ? (
				<p className="text-[11px] text-gray-500">{hint}</p>
			) : null}
		</label>
	)
}
