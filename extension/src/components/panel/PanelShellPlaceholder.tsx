import React from "react"

type PanelShellPlaceholderProps = {
	title: string
	children?: React.ReactNode
}

export default function PanelShellPlaceholder({ title, children }: PanelShellPlaceholderProps) {
	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 2147483646,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "rgba(0,0,0,0.4)"
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: 8,
					boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
					width: 720,
					maxWidth: "95vw",
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden"
				}}
			>
				<div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 14, fontWeight: 500 }}>{title}</div>
				<div style={{ padding: 16, fontSize: 14, color: "#111827" }}>{children}</div>
				<div style={{ padding: "10px 16px", borderTop: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>面板占位壳（BrandBar / Content / Footer）</div>
			</div>
		</div>
	)
}


