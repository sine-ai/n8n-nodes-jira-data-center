import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class JiraDataCenterApi implements ICredentialType {
	name = 'jiraDataCenterApi';

	displayName = 'Jira Data Center API';

	documentationUrl = 'https://confluence.atlassian.com/server/creating-personal-access-tokens-1085769461.html';

	icon: Icon = 'file:jira.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'server',
			type: 'string',
			default: 'https://jira.example.com',
			placeholder: 'https://jira.example.com',
			description: 'The base URL of your Jira Data Center server',
			required: true,
		},
		{
			displayName: 'Personal Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Personal Access Token for authenticating with Jira Data Center API',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.server}}',
			url: '/rest/api/2/myself',
			method: 'GET',
		},
	};
}
