import { ApiError } from './errors';
import { request } from './client';
import type { CompanyMenu, CompanyWidget } from '@/types/api';
export { uploadLogo } from './resources';

function decodeCompanyMenu(value: unknown): CompanyMenu {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ApiError('The company menu response returned an unsupported format.');
	const menu = value as CompanyMenu;
	if (
		!Number.isInteger(menu.id) ||
		!Number.isInteger(menu.menuId) ||
		typeof menu.menuCode !== 'string' ||
		typeof menu.displayName !== 'string' ||
		!Number.isInteger(menu.moduleId) ||
		typeof menu.isEnabled !== 'boolean' ||
		!Number.isInteger(menu.sortOrder)
	)
		throw new ApiError('The company menu response is missing required fields.');
	return menu;
}

function decodeCompanyWidget(value: unknown): CompanyWidget {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ApiError('The company widget response returned an unsupported format.');
	const widget = value as CompanyWidget;
	if (
		!Number.isInteger(widget.id) ||
		!Number.isInteger(widget.widgetId) ||
		typeof widget.widgetCode !== 'string' ||
		typeof widget.widgetName !== 'string' ||
		typeof widget.widgetType !== 'string' ||
		typeof widget.isEnabled !== 'boolean'
	)
		throw new ApiError('The company widget response is missing required fields.');
	return widget;
}

export async function getMenus(companyId: number): Promise<CompanyMenu[]> {
	const data = await request<unknown>('GET', `/Companies/${companyId}/GetMenus`);
	if (!Array.isArray(data))
		throw new ApiError('The company menu list response is invalid.');
	return data.map(decodeCompanyMenu);
}

export async function getWidgets(companyId: number): Promise<CompanyWidget[]> {
	const data = await request<unknown>('GET', `/Companies/${companyId}/GetWidgets`);
	if (!Array.isArray(data))
		throw new ApiError('The company widget list response is invalid.');
	return data.map(decodeCompanyWidget);
}
