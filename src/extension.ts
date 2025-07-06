// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			'csv-viz.csvEditor',
			new CsvEditorProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
			}
		)
	);
}

class CsvEditorProvider implements vscode.CustomTextEditorProvider {
	constructor(private readonly context: vscode.ExtensionContext) {}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		// Send initial data to the webview
		this.updateWebview(document, webviewPanel);

		// Listen for changes to the document
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				this.updateWebview(document, webviewPanel);
			}
		});

		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive messages from the webview
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'saveState':
					this.context.workspaceState.update(document.uri.toString(), e.data);
					return;
			}
		});

		// Send saved state to the webview
		const savedState = this.context.workspaceState.get(document.uri.toString());
		if (savedState) {
			webviewPanel.webview.postMessage({
				type: 'restoreState',
				data: savedState
			});
		}
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'main.js'));

		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'style.css'));

		const nonce = this.getNonce();

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="stylesheet" href="${styleUri}">
				<title>CSViz</title>
			</head>
			<body>
				<div id="controls">
					<label for="font-size">Font Size:</label>
					<input type="number" id="font-size" value="16" min="8" max="72">
					<label for="font-color">Font Color:</label>
					<input type="color" id="font-color" value="#000000">
					<label for="header-bg-color">Header Background:</label>
					<input type="color" id="header-bg-color" value="#f2f2f2">
				</div>
				<div id="csv-table-container"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>
		`;
	}

	private updateWebview(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
		webviewPanel.webview.postMessage({
			type: 'csvUpdate',
			data: document.getText()
		});
	}

	private getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
