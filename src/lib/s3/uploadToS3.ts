import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { config } from '@config/environment';
import { error } from '@logger';

export async function uploadToS3(filePath: string): Promise<string | null> {
	try {
		const fileContent = await readFile(filePath);
		const fileName = basename(filePath);
		const uploadUrl = `${config.S3_BUCKET_URL}/${fileName}`;

		const response = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${config.S3_TOKEN}`,
			},
			body: fileContent,
		});

		if (!response.ok) {
			const errorText = await response.text();
			error(`Failed to upload to S3: ${response.status} ${response.statusText}`, errorText);
			return null;
		}

		return uploadUrl;
	} catch (err) {
		error('Error uploading to S3:', err);
		return null;
	}
}
