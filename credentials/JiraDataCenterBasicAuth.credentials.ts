import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class JiraDataCenterBasicAuth implements ICredentialType {
	name = 'jiraDataCenterBasicAuth';

	displayName = 'Jira Data Center Basic Auth';

	documentationUrl = 'https://developer.atlassian.com/server/bitbucket/how-tos/example-basic-authentication/';

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
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Your Jira username',
			required: true,
		},
		{
			displayName: 'Password / Token',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Jira password or Personal Access Token',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
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
