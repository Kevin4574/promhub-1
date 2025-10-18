export interface ProgressBarProps {
	value: number
	max: number
	indicatorClassName?: string
	className?: string
}

export function ProgressBar({ value, max, indicatorClassName = "bg-blue-500", className = "" }: ProgressBarProps) {
	const clampedMax = max > 0 ? max : 1
	const ratio = Math.min(Math.max(value / clampedMax, 0), 1)
	const percentage = `${Math.round(ratio * 10000) / 100}%`

	return (
		<div
			className={`w-full rounded-full bg-gray-200 ${className}`.trim()}
			style={{ height: "10px" }}
		>
			<div
				className={`h-full rounded-full transition-all duration-200 ${indicatorClassName}`}
				style={{ width: percentage }}
			/>
		</div>
	)
}
