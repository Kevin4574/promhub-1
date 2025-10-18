chrome.runtime.onInstalled.addListener(() => {
	createOrUpdateContextMenus()
})

chrome.runtime.onStartup?.addListener(() => {
	createOrUpdateContextMenus()
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab?.id) return
	if (info.menuItemId === "pm-notepad") {
        // 面向当前标签页发送
        try { await chrome.tabs.sendMessage(tab.id, { type: "pm:notepad:open" }) } catch {}
        // 再做一次扩展级广播，增加可靠性
        try { await chrome.runtime.sendMessage({ type: "pm:notepad:open" }) } catch {}
	}
	if (info.menuItemId === "pm-quick-save") {
        try { await chrome.tabs.sendMessage(tab.id, { type: "pm:quick-save:open" }) } catch {}
        try { await chrome.runtime.sendMessage({ type: "pm:quick-save:open" }) } catch {}
	}
})

chrome.runtime.onMessage.addListener((msg, sender, _sendResponse) => {
	try {
		const tabId = sender?.tab?.id
		if (tabId) {
			chrome.tabs.sendMessage(tabId, msg)
		}
	} catch {}
})

function createOrUpdateContextMenus() {
	try {
		chrome.contextMenus.removeAll(() => {
			chrome.contextMenus.create({
				id: "pm-notepad",
				title: "Notepad 占位",
				contexts: ["selection", "page"]
			})
			chrome.contextMenus.create({
				id: "pm-quick-save",
				title: "快速保存 占位",
				contexts: ["selection"]
			})
		})
	} catch (e) {
		// ignore
	}
}

// 确保在 Service Worker 激活/重载后也会立即创建菜单
createOrUpdateContextMenus()


