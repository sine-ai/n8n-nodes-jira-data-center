import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class JiraDataCenter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jira Data Center',
		name: 'jiraDataCenter',
		icon: 'file:jira.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Jira Data Center API',
		defaults: {
			name: 'Jira Data Center',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'jiraDataCenterApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
			{
				name: 'jiraDataCenterBasicAuth',
				required: true,
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Personal Access Token',
						value: 'accessToken',
					},
					{
						name: 'Basic Auth',
						value: 'basicAuth',
					},
				],
				default: 'accessToken',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Comment',
						value: 'comment',
					},
					{
						name: 'Issue',
						value: 'issue',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Workflow',
						value: 'workflow',
					},
				],
				default: 'issue',
			},

			// Project Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a project',
						action: 'Get a project',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all projects',
						action: 'Get all projects',
					},
				],
				default: 'getAll',
			},

			// Issue Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['issue'],
					},
				},
				options: [
					{
						name: 'Assign',
						value: 'assign',
						description: 'Assign an issue to a user',
						action: 'Assign an issue',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create an issue',
						action: 'Create an issue',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an issue',
						action: 'Delete an issue',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an issue',
						action: 'Get an issue',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all issues',
						action: 'Get all issues',
					},
					{
						name: 'Transition',
						value: 'transition',
						description: 'Transition an issue to a new status',
						action: 'Transition an issue',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an issue',
						action: 'Update an issue',
					},
				],
				default: 'getAll',
			},

			// Comment Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['comment'],
					},
				},
				options: [
					{
						name: 'Add',
						value: 'add',
						description: 'Add a comment to an issue',
						action: 'Add a comment',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a comment',
						action: 'Delete a comment',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all comments on an issue',
						action: 'Get all comments',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a comment',
						action: 'Update a comment',
					},
				],
				default: 'getAll',
			},

			// Workflow Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['workflow'],
					},
				},
				options: [
					{
						name: 'Get Transitions',
						value: 'getTransitions',
						description: 'Get available transitions for an issue',
						action: 'Get transitions',
					},
				],
				default: 'getTransitions',
			},

			// User Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get user information',
						action: 'Get user information',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for users',
						action: 'Search for users',
					},
				],
				default: 'get',
			},

			// Common Parameters
			{
				displayName: 'Project',
				name: 'projectKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjects',
				},
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The project to work with',
				required: true,
			},
			{
				displayName: 'Project',
				name: 'projectKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjects',
				},
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['create', 'getAll'],
					},
				},
				default: '',
				description: 'The project to work with',
				required: true,
			},

			// Issue specific parameters
			{
				displayName: 'Issue Key',
				name: 'issueKey',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['get', 'update', 'delete', 'assign', 'transition'],
					},
				},
				default: '',
				placeholder: 'PROJ-123',
				description: 'The key of the issue (e.g., PROJ-123)',
				required: true,
			},
			{
				displayName: 'Issue Key',
				name: 'issueKey',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['comment', 'workflow'],
					},
				},
				default: '',
				placeholder: 'PROJ-123',
				description: 'The key of the issue (e.g., PROJ-123)',
				required: true,
			},
			{
				displayName: 'Issue Type',
				name: 'issueType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getIssueTypes',
					loadOptionsDependsOn: ['projectKey'],
				},
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The type of the issue',
				required: true,
			},
			{
				displayName: 'Summary',
				name: 'summary',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The summary/title of the issue',
				required: true,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The description of the issue',
			},
			{
				displayName: 'Assignee',
				name: 'assignee',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['assign'],
					},
				},
				default: '',
				description: 'Username or account ID of the user to assign the issue to',
				required: true,
			},
			{
				displayName: 'Transition ID',
				name: 'transitionId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['issue'],
						operation: ['transition'],
					},
				},
				default: '',
				description: 'The ID of the transition to execute',
				required: true,
			},

			// Comment specific parameters
			{
				displayName: 'Comment ID',
				name: 'commentId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['comment'],
						operation: ['update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the comment',
				required: true,
			},
			{
				displayName: 'Comment Body',
				name: 'body',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['comment'],
						operation: ['add', 'update'],
					},
				},
				default: '',
				description: 'The body/content of the comment',
				required: true,
			},

			// User specific parameters
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The username to get information for (leave empty for current user)',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Search query to find users',
				required: true,
			},

			// Common pagination parameters
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		let credentials;
		const authentication = this.getNodeParameter('authentication', 0) as string;

		if (authentication === 'accessToken') {
			credentials = await this.getCredentials('jiraDataCenterApi');
		} else {
			credentials = await this.getCredentials('jiraDataCenterBasicAuth');
		}

		const baseURL = credentials.server as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'project') {
					responseData = await handleProjectOperations.call(this, i, operation, baseURL, authentication);
				} else if (resource === 'issue') {
					responseData = await handleIssueOperations.call(this, i, operation, baseURL, authentication);
				} else if (resource === 'comment') {
					responseData = await handleCommentOperations.call(this, i, operation, baseURL, authentication);
				} else if (resource === 'user') {
					responseData = await handleUserOperations.call(this, i, operation, baseURL, authentication);
				} else if (resource === 'workflow') {
					responseData = await handleWorkflowOperations.call(this, i, operation, baseURL, authentication);
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else if (responseData) {
					returnData.push(responseData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						error: error instanceof Error ? error.message : 'Unknown error',
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}

	methods = {
		loadOptions: {
			async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const authentication = this.getNodeParameter('authentication', 0) as string;
				let credentials;

				if (authentication === 'accessToken') {
					credentials = await this.getCredentials('jiraDataCenterApi');
				} else {
					credentials = await this.getCredentials('jiraDataCenterBasicAuth');
				}

				const baseURL = credentials.server as string;

				try {
					const responseData = await makeApiRequestForOptions.call(
						this,
						'GET',
						`${baseURL}/rest/api/2/project`,
						undefined,
						undefined,
						authentication,
					);

					const projects = Array.isArray(responseData) ? responseData : [];
					for (const project of projects) {
						returnData.push({
							name: `${project.key} - ${project.name}`,
							value: project.key,
						});
					}
				} catch (error) {
					// If there's an error, return empty array instead of throwing
					return [];
				}

				return returnData.sort((a, b) => a.name.localeCompare(b.name));
			},

			async getIssueTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const projectKey = this.getNodeParameter('projectKey') as string;
				if (!projectKey) {
					return returnData;
				}

				const authentication = this.getNodeParameter('authentication', 0) as string;
				let credentials;

				if (authentication === 'accessToken') {
					credentials = await this.getCredentials('jiraDataCenterApi');
				} else {
					credentials = await this.getCredentials('jiraDataCenterBasicAuth');
				}

				const baseURL = credentials.server as string;

				try {
					const responseData = await makeApiRequestForOptions.call(
						this,
						'GET',
						`${baseURL}/rest/api/2/project/${projectKey}`,
						undefined,
						undefined,
						authentication,
					);

					const issueTypes = responseData.issueTypes || [];
					for (const issueType of issueTypes) {
						returnData.push({
							name: issueType.name,
							value: issueType.id,
						});
					}
				} catch (error) {
					// If there's an error, return empty array instead of throwing
					return [];
				}

				return returnData.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};
}

// Helper function to make API requests for loadOptions
async function makeApiRequestForOptions(
	this: ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	url: string,
	body?: IDataObject,
	qs?: IDataObject,
	authentication?: string,
): Promise<any> {
	const options: IRequestOptions = {
		method,
		body,
		qs,
		url,
		json: true,
	};

	// Use the authentication method specified, or default to accessToken
	const authMethod = authentication || 'accessToken';
	const credentialType = authMethod === 'accessToken' ? 'jiraDataCenterApi' : 'jiraDataCenterBasicAuth';

	try {
		return await this.helpers.requestWithAuthentication.call(this, credentialType, options);
	} catch (error) {
		throw new NodeOperationError(this.getNode(), `Jira Data Center API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Helper function to make API requests
async function makeApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	url: string,
	body?: IDataObject,
	qs?: IDataObject,
	authentication?: string,
): Promise<any> {
	const options: IRequestOptions = {
		method,
		body,
		qs,
		url,
		json: true,
	};

	// Use the authentication method specified, or default to accessToken
	const authMethod = authentication || 'accessToken';
	const credentialType = authMethod === 'accessToken' ? 'jiraDataCenterApi' : 'jiraDataCenterBasicAuth';

	try {
		return await this.helpers.requestWithAuthentication.call(this, credentialType, options);
	} catch (error) {
		throw new NodeOperationError(this.getNode(), `Jira Data Center API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Project operations handler
async function handleProjectOperations(
	this: IExecuteFunctions,
	index: number,
	operation: string,
	baseURL: string,
	authentication: string,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', index);
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', index) as number);
		
		let url = `${baseURL}/rest/api/2/project`;
		const qs: IDataObject = {};
		
		if (limit) {
			qs.maxResults = limit;
		}

		const responseData = await makeApiRequest.call(this, 'GET', url, undefined, qs, authentication);
		return Array.isArray(responseData) ? responseData : [];
	}

	if (operation === 'get') {
		const projectKey = this.getNodeParameter('projectKey', index) as string;
		const url = `${baseURL}/rest/api/2/project/${projectKey}`;
		return await makeApiRequest.call(this, 'GET', url, undefined, undefined, authentication);
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "project"`);
}

// Issue operations handler
async function handleIssueOperations(
	this: IExecuteFunctions,
	index: number,
	operation: string,
	baseURL: string,
	authentication: string,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const projectKey = this.getNodeParameter('projectKey', index) as string;
		const returnAll = this.getNodeParameter('returnAll', index);
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', index) as number);
		
		let url = `${baseURL}/rest/api/2/search`;
		const qs: IDataObject = {
			jql: `project = ${projectKey}`,
		};
		
		if (limit) {
			qs.maxResults = limit;
		}

		const responseData = await makeApiRequest.call(this, 'GET', url, undefined, qs, authentication);
		return responseData.issues || [];
	}

	if (operation === 'get') {
		const issueKey = this.getNodeParameter('issueKey', index) as string;
		const url = `${baseURL}/rest/api/2/issue/${issueKey}`;
		return await makeApiRequest.call(this, 'GET', url, undefined, undefined, authentication);
	}

	if (operation === 'create') {
		const projectKey = this.getNodeParameter('projectKey', index) as string;
		const issueType = this.getNodeParameter('issueType', index) as string;
		const summary = this.getNodeParameter('summary', index) as string;
		const description = this.getNodeParameter('description', index) as string;

		const body: IDataObject = {
			fields: {
				project: {
					key: projectKey,
				},
				issuetype: {
					id: issueType,
				},
				summary,
				description,
			},
		};

		const url = `${baseURL}/rest/api/2/issue`;
		return await makeApiRequest.call(this, 'POST', url, body, undefined, authentication);
	}

	if (operation === 'update') {
		const issueKey = this.getNodeParameter('issueKey', index) as string;
		const summary = this.getNodeParameter('summary', index) as string;
		const description = this.getNodeParameter('description', index) as string;

		const body: IDataObject = {
			fields: {},
		};

		if (summary) {
			(body.fields as IDataObject).summary = summary;
		}
		if (description) {
			(body.fields as IDataObject).description = description;
		}

		const url = `${baseURL}/rest/api/2/issue/${issueKey}`;
		await makeApiRequest.call(this, 'PUT', url, body, undefined, authentication);
		return { success: true };
	}

	if (operation === 'delete') {
		const issueKey = this.getNodeParameter('issueKey', index) as string;
		const url = `${baseURL}/rest/api/2/issue/${issueKey}`;
		await makeApiRequest.call(this, 'DELETE', url, undefined, undefined, authentication);
		return { success: true };
	}

	if (operation === 'assign') {
		const issueKey = this.getNodeParameter('issueKey', index) as string;
		const assignee = this.getNodeParameter('assignee', index) as string;

		const body: IDataObject = {
			name: assignee,
		};

		const url = `${baseURL}/rest/api/2/issue/${issueKey}/assignee`;
		await makeApiRequest.call(this, 'PUT', url, body, undefined, authentication);
		return { success: true };
	}

	if (operation === 'transition') {
		const issueKey = this.getNodeParameter('issueKey', index) as string;
		const transitionId = this.getNodeParameter('transitionId', index) as string;

		const body: IDataObject = {
			transition: {
				id: transitionId,
			},
		};

		const url = `${baseURL}/rest/api/2/issue/${issueKey}/transitions`;
		await makeApiRequest.call(this, 'POST', url, body, undefined, authentication);
		return { success: true };
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "issue"`);
}

// Comment operations handler
async function handleCommentOperations(
	this: IExecuteFunctions,
	index: number,
	operation: string,
	baseURL: string,
	authentication: string,
): Promise<IDataObject | IDataObject[]> {
	const issueKey = this.getNodeParameter('issueKey', index) as string;

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', index);
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', index) as number);
		
		let url = `${baseURL}/rest/api/2/issue/${issueKey}/comment`;
		const qs: IDataObject = {};
		
		if (limit) {
			qs.maxResults = limit;
		}

		const responseData = await makeApiRequest.call(this, 'GET', url, undefined, qs, authentication);
		return responseData.comments || [];
	}

	if (operation === 'add') {
		const body = this.getNodeParameter('body', index) as string;

		const requestBody: IDataObject = {
			body,
		};

		const url = `${baseURL}/rest/api/2/issue/${issueKey}/comment`;
		return await makeApiRequest.call(this, 'POST', url, requestBody, undefined, authentication);
	}

	if (operation === 'update') {
		const commentId = this.getNodeParameter('commentId', index) as string;
		const body = this.getNodeParameter('body', index) as string;

		const requestBody: IDataObject = {
			body,
		};

		const url = `${baseURL}/rest/api/2/issue/${issueKey}/comment/${commentId}`;
		return await makeApiRequest.call(this, 'PUT', url, requestBody, undefined, authentication);
	}

	if (operation === 'delete') {
		const commentId = this.getNodeParameter('commentId', index) as string;
		const url = `${baseURL}/rest/api/2/issue/${issueKey}/comment/${commentId}`;
		await makeApiRequest.call(this, 'DELETE', url, undefined, undefined, authentication);
		return { success: true };
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "comment"`);
}

// Workflow operations handler
async function handleWorkflowOperations(
	this: IExecuteFunctions,
	index: number,
	operation: string,
	baseURL: string,
	authentication: string,
): Promise<IDataObject | IDataObject[]> {
	const issueKey = this.getNodeParameter('issueKey', index) as string;

	if (operation === 'getTransitions') {
		const url = `${baseURL}/rest/api/2/issue/${issueKey}/transitions`;
		const responseData = await makeApiRequest.call(this, 'GET', url, undefined, undefined, authentication);
		return responseData.transitions || [];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "workflow"`);
}

// User operations handler
async function handleUserOperations(
	this: IExecuteFunctions,
	index: number,
	operation: string,
	baseURL: string,
	authentication: string,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const username = this.getNodeParameter('username', index) as string;
		
		if (username) {
			const url = `${baseURL}/rest/api/2/user?username=${username}`;
			return await makeApiRequest.call(this, 'GET', url, undefined, undefined, authentication);
		} else {
			// Get current user
			const url = `${baseURL}/rest/api/2/myself`;
			return await makeApiRequest.call(this, 'GET', url, undefined, undefined, authentication);
		}
	}

	if (operation === 'search') {
		const query = this.getNodeParameter('query', index) as string;
		const returnAll = this.getNodeParameter('returnAll', index);
		const limit = returnAll ? undefined : (this.getNodeParameter('limit', index) as number);
		
		let url = `${baseURL}/rest/api/2/user/search`;
		const qs: IDataObject = {
			username: query,
		};
		
		if (limit) {
			qs.maxResults = limit;
		}

		const responseData = await makeApiRequest.call(this, 'GET', url, undefined, qs, authentication);
		return Array.isArray(responseData) ? responseData : [];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "user"`);
}

