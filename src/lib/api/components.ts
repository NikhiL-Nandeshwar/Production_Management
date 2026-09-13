import { ApiError } from './errors';
import { mutation, request } from './client';
import type { Component } from '@/types/api';
import type {
	ComponentsCreateRequest,
	ComponentsUpdateRequest,
} from '@/types/requests';

function decodeComponent(value: unknown): Component {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ApiError('The component response returned an unsupported format.');
	const component = value as Component;
	if (
		!Number.isInteger(component.id) ||
			!Number.isInteger(component.companyId) ||
		typeof component.componentCode !== 'string' ||
		typeof component.componentName !== 'string' ||
		typeof component.drawingNumber !== 'string' ||
		typeof component.unitOfMeasure !== 'string' ||
		 typeof component.isActive !== 'boolean' ||
		 typeof component.createdAt !== 'string'
	)
		throw new ApiError('The component response is missing required fields.');
	return component;
}

export async function getAll(companyId: number): Promise<Component[]> {
	const data = await request<unknown>('GET', '/Components/GetAll', undefined, {
		companyId,
	});
	 if (!Array.isArray(data))
		 throw new ApiError('The components list response is invalid.');
	return data.map(decodeComponent);
}
export const getById = (id: number, companyId: number) =>
	request<unknown>('GET', `/Components/${id}/GetById`, undefined, {
		companyId,
	}).then(decodeComponent);
export const create = (companyId: number, payload: ComponentsCreateRequest) =>
	mutation('POST', '/Components/Create', payload, { companyId });
export const update = (companyId: number, payload: ComponentsUpdateRequest) =>
	mutation('PUT', '/Components/Update', payload, { companyId });
