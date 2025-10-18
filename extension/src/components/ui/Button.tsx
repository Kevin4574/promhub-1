import type { ButtonHTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"

type ButtonVariant = "primary" | "secondary" | "ghost"

type ButtonSize = "md" | "sm"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
	loading?: boolean
	leftIcon?: ReactNode
	fullWidth?: boolean
}

const baseClasses =
	"inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md focus-visible:outline-blue-400 disabled:bg-gradient-to-r disabled:from-blue-400 disabled:to-purple-500",
	secondary:
		"text-blue-600 bg-blue-50 border border-blue-200 focus-visible:outline-blue-300 hover:bg-blue-100",
	ghost: "text-gray-600 bg-transparent hover:bg-gray-100 focus-visible:outline-gray-300"
}

const sizeClasses: Record<ButtonSize, string> = {
	md: "h-9 px-3 text-sm",
	sm: "h-8 px-2.5 text-xs"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{
		variant = "primary",
		size = "md",
		loading = false,
		leftIcon,
		fullWidth = true,
		className = "",
		disabled,
		children,
		...rest
	},
	ref
) {
	const isDisabled = disabled || loading
	const classes = [
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		fullWidth ? "w-full" : "",
		className
	]
		.filter(Boolean)
		.join(" ")

	return (
		<button ref={ref} className={classes} disabled={isDisabled} {...rest}>
			{loading ? (
				<span className="flex items-center gap-2">
					<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-r-white"></span>
					<span>{children}</span>
				</span>
			) : (
				<span className="flex items-center gap-2">
					{leftIcon ? <span className="text-base leading-none">{leftIcon}</span> : null}
					<span>{children}</span>
				</span>
			)}
		</button>
	)
})
