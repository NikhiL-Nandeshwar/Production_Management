import { ApiError } from './errors';
import { mutation, request } from './client';
import type { DowntimeCategory } from '@/types/api';
import type {
	DowntimeCategoriesCreateRequest,
	DowntimeCategoriesUpdateRequest,
} from '@/types/requests';

function decodeDowntimeCategory(value: unknown): DowntimeCategory {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ApiError(
			'The downtime category response returned an unsupported format.',
		);
	const category = value as DowntimeCategory;
	if (
		!Number.isInteger(category.id) ||
		!Number.isInteger(category.companyId) ||
		typeof category.categoryName !== 'string' ||
		typeof category.isActive !== 'boolean' ||
		typeof category.createdAt !== 'string'
	)
		throw new ApiError(
			'The downtime category response is missing required fields.',
		);
	return category;
}

export async function getAll(
	companyId: number,
	onlyActive: boolean,
): Promise<DowntimeCategory[]> {
	const data = await request<unknown>(
		'GET',
		'/DowntimeCategories/GetAll',
		undefined,
		{ onlyActive, companyId },
	);
	if (!Array.isArray(data))
		throw new ApiError('The downtime categories list response is invalid.');
	return data.map(decodeDowntimeCategory);
}

export const getById = (id: number, companyId: number) =>
	request<unknown>(
		'GET',
		`/DowntimeCategories/${id}/GetById`,
		undefined,
		{ companyId },
	).then(decodeDowntimeCategory);

export const create = (
	companyId: number,
	payload: DowntimeCategoriesCreateRequest,
) => mutation('POST', '/DowntimeCategories/Create', payload, { companyId });

export const update = (
	companyId: number,
	payload: DowntimeCategoriesUpdateRequest,
) => mutation('PUT', '/DowntimeCategories/Update', payload, { companyId });

export const toggleActive = (id: number, companyId: number) =>
	mutation('PATCH', `/DowntimeCategories/${id}/toggle-active`, undefined, {
		companyId,
	});
