import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class JiraDataCenterTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jira Data Center Trigger',
		name: 'jiraDataCenterTrigger',
		icon: 'file:jira.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Handle Jira Data Center webhooks',
		defaults: {
			name: 'Jira Data Center Trigger',
		},
		inputs: [],
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
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
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
			displayName: 'Project (Optional)',
			name: 'projectKey',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getProjects',
			},
			default: '',
			description: 'Filter events to a specific project (leave empty for all projects)',
		},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					// ISSUE EVENTS
					{
						name: 'Issue Created',
						value: 'jira:issue_created',
						description: 'Triggered when a new issue is created',
					},
					{
						name: 'Issue Updated',
						value: 'jira:issue_updated',
						description: 'Triggered when an issue is updated',
					},
					{
						name: 'Issue Deleted',
						value: 'jira:issue_deleted',
						description: 'Triggered when an issue is deleted',
					},
					{
						name: 'Issue Assigned',
						value: 'jira:issue_assigned',
						description: 'Triggered when an issue is assigned to a user',
					},
					{
						name: 'Issue Transitioned',
						value: 'jira:issue_transitioned',
						description: 'Triggered when an issue transitions between statuses',
					},

					// COMMENT EVENTS
					{
						name: 'Comment Created',
						value: 'comment_created',
						description: 'Triggered when a comment is added to an issue',
					},
					{
						name: 'Comment Updated',
						value: 'comment_updated',
						description: 'Triggered when a comment is edited',
					},
					{
						name: 'Comment Deleted',
						value: 'comment_deleted',
						description: 'Triggered when a comment is deleted',
					},

					// PROJECT EVENTS
					{
						name: 'Project Created',
						value: 'project_created',
						description: 'Triggered when a new project is created',
					},
					{
						name: 'Project Updated',
						value: 'project_updated',
						description: 'Triggered when a project is updated',
					},
					{
						name: 'Project Deleted',
						value: 'project_deleted',
						description: 'Triggered when a project is deleted',
					},

					// VERSION EVENTS
					{
						name: 'Version Created',
						value: 'jira:version_created',
						description: 'Triggered when a new version is created',
					},
					{
						name: 'Version Updated',
						value: 'jira:version_updated',
						description: 'Triggered when a version is updated',
					},
					{
						name: 'Version Released',
						value: 'jira:version_released',
						description: 'Triggered when a version is released',
					},
					{
						name: 'Version Deleted',
						value: 'jira:version_deleted',
						description: 'Triggered when a version is deleted',
					},

					// USER EVENTS
					{
						name: 'User Created',
						value: 'user_created',
						description: 'Triggered when a new user is created',
					},
					{
						name: 'User Updated',
						value: 'user_updated',
						description: 'Triggered when a user profile is updated',
					},
					{
						name: 'User Deleted',
						value: 'user_deleted',
						description: 'Triggered when a user is deleted',
					},
				],
				default: ['jira:issue_created', 'jira:issue_updated'],
				description: 'The Jira events to listen to',
				required: true,
			},
		],
	};

	// @ts-ignore (because of inconsistent interface)
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId === undefined) {
					return false;
				}

				const authentication = this.getNodeParameter('authentication') as string;
				let credentials;

				if (authentication === 'accessToken') {
					credentials = await this.getCredentials('jiraDataCenterApi');
				} else {
					credentials = await this.getCredentials('jiraDataCenterBasicAuth');
				}

				const baseURL = credentials.server as string;

				const options: IRequestOptions = {
					method: 'GET',
					url: `${baseURL}/rest/webhooks/1.0/webhook/${webhookData.webhookId}`,
					json: true,
				};

				const credentialType = authentication === 'accessToken' ? 'jiraDataCenterApi' : 'jiraDataCenterBasicAuth';

				try {
					await this.helpers.requestWithAuthentication.call(this, credentialType, options);
				} catch (error) {
					if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
						return false;
					}
					throw error;
				}

				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events') as string[];
				const projectKey = this.getNodeParameter('projectKey') as string;
				
				let credentials;
				const authentication = this.getNodeParameter('authentication') as string;

				if (authentication === 'accessToken') {
					credentials = await this.getCredentials('jiraDataCenterApi');
				} else {
					credentials = await this.getCredentials('jiraDataCenterBasicAuth');
				}

				const baseURL = credentials.server as string;

				const body: IDataObject = {
					name: `n8n-jira-webhook-${Date.now()}`,
					url: webhookUrl,
					events: events,
					enabled: true,
				};

				// Add project filter if specified
				if (projectKey) {
					body.filters = {
						'issue-related-events-section': {
							projects: [{ key: projectKey }],
						},
					};
				}

				const credentialType = authentication === 'accessToken' ? 'jiraDataCenterApi' : 'jiraDataCenterBasicAuth';

				// Try multiple webhook API endpoints as different Jira versions use different APIs
				const webhookEndpoints = [
					`${baseURL}/rest/api/2/webhook`,  // Modern Jira API
					`${baseURL}/rest/webhooks/1.0/webhook`,  // Atlassian webhook plugin
					`${baseURL}/plugins/servlet/webhooks`  // Legacy endpoint
				];

				let webhookCreated = false;
				let lastError: any;

				for (const endpoint of webhookEndpoints) {
					const options: IRequestOptions = {
						method: 'POST',
						url: endpoint,
						body,
						json: true,
					};

					try {
						const responseData = await this.helpers.requestWithAuthentication.call(this, credentialType, options);

						// Different endpoints might return different response structures
						if (responseData.id || responseData.self || responseData.key) {
							const webhookData = this.getWorkflowStaticData('node');
							
							if (responseData.id) {
								webhookData.webhookId = responseData.id;
							} else if (responseData.self) {
								const urlParts = responseData.self.split('/');
								webhookData.webhookId = urlParts[urlParts.length - 1];
							} else if (responseData.key) {
								webhookData.webhookId = responseData.key;
							}
							
							webhookData.webhookEndpoint = endpoint;
							webhookCreated = true;
							break;
						}
					} catch (error) {
						lastError = error;
						// Continue to next endpoint
						continue;
					}
				}

				if (!webhookCreated) {
					// For localhost development, provide a helpful warning instead of failing
					if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
						console.warn('Webhook creation failed - this is expected for localhost development. The trigger will still work for manual testing.');
						// Create a dummy webhook ID for localhost development
						const webhookData = this.getWorkflowStaticData('node');
						webhookData.webhookId = `localhost-dev-${Date.now()}`;
						webhookData.webhookEndpoint = 'localhost-dev';
						return true;
					} else {
						throw new NodeOperationError(
							this.getNode(), 
							`Failed to create Jira webhook on all endpoints. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}. Tried endpoints: ${webhookEndpoints.join(', ')}`
						);
					}
				}

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId !== undefined) {
					// Handle localhost development case
					if (webhookData.webhookEndpoint === 'localhost-dev') {
						console.warn('Skipping webhook deletion for localhost development');
						delete webhookData.webhookId;
						delete webhookData.webhookEndpoint;
						return true;
					}

					let credentials;
					const authentication = this.getNodeParameter('authentication') as string;

					if (authentication === 'accessToken') {
						credentials = await this.getCredentials('jiraDataCenterApi');
					} else {
						credentials = await this.getCredentials('jiraDataCenterBasicAuth');
					}

					const baseURL = credentials.server as string;
					const credentialType = authentication === 'accessToken' ? 'jiraDataCenterApi' : 'jiraDataCenterBasicAuth';

					// Use the same endpoint that was used to create the webhook
					const endpoint = webhookData.webhookEndpoint || `${baseURL}/rest/webhooks/1.0/webhook`;
					const deleteUrl = `${endpoint}/${webhookData.webhookId}`.replace('/webhook/', '/webhook/');

					const options: IRequestOptions = {
						method: 'DELETE',
						url: deleteUrl,
						json: true,
					};

					try {
						await this.helpers.requestWithAuthentication.call(this, credentialType, options);
					} catch (error) {
						// If deletion fails, try alternative endpoints
						const alternativeEndpoints = [
							`${baseURL}/rest/api/2/webhook/${webhookData.webhookId}`,
							`${baseURL}/rest/webhooks/1.0/webhook/${webhookData.webhookId}`,
							`${baseURL}/plugins/servlet/webhooks/${webhookData.webhookId}`
						];

						let deleted = false;
						for (const altEndpoint of alternativeEndpoints) {
							try {
								const altOptions: IRequestOptions = {
									method: 'DELETE',
									url: altEndpoint,
									json: true,
								};
								await this.helpers.requestWithAuthentication.call(this, credentialType, altOptions);
								deleted = true;
								break;
							} catch (altError) {
								continue;
							}
						}

						if (!deleted) {
							console.warn('Failed to delete webhook, but continuing anyway');
						}
					}

					// Remove from the static workflow data so that it is clear
					// that no webhooks are registered anymore
					delete webhookData.webhookId;
					delete webhookData.webhookEndpoint;
				}

				return true;
			},
		},
	};

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
					const responseData = await makeApiRequestForTriggerOptions.call(
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
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = (this.getBodyData() || {}) as IDataObject;
		const headers = this.getHeaderData() as IDataObject;

		// Verify that the webhook is from Jira (Atlassian product)
		const userAgent = headers['user-agent'] as string;
		if (!userAgent || !userAgent.toLowerCase().includes('atlassian')) {
			throw new NodeOperationError(this.getNode(), 'Request does not seem to be from Jira Data Center');
		}

		// Extract event type - Jira uses different header names
		let eventKey = '';
		
		// Try different possible event header names used by Jira
		if (headers['x-atlassian-webhook-identifier']) {
			eventKey = headers['x-atlassian-webhook-identifier'] as string;
		} else if (bodyData.webhookEvent) {
			eventKey = bodyData.webhookEvent as string;
		} else if (bodyData.eventType) {
			eventKey = bodyData.eventType as string;
		}
		
		if (!eventKey) {
			throw new NodeOperationError(this.getNode(), 'No event type found in webhook payload');
		}

		// Filter events based on what the user selected
		const events = this.getNodeParameter('events') as string[];
		if (!events.includes(eventKey)) {
			// If we do not care about the event, do not process it further
			return {
				noWebhookResponse: true,
			};
		}

		// Check project filter if specified
		const projectKeyFilter = this.getNodeParameter('projectKey') as string;
		if (projectKeyFilter && bodyData.issue && typeof bodyData.issue === 'object') {
			const issue = bodyData.issue as IDataObject;
			if (issue.fields && typeof issue.fields === 'object') {
				const fields = issue.fields as IDataObject;
				if (fields.project && typeof fields.project === 'object') {
					const project = fields.project as IDataObject;
					if (project.key !== projectKeyFilter) {
						return {
							noWebhookResponse: true,
						};
					}
				}
			}
		}

		const returnData: IDataObject[] = [];

		// Process the webhook payload
		const webhookData: IDataObject = {
			event: eventKey,
			timestamp: bodyData.timestamp || new Date().toISOString(),
			headers,
			body: bodyData,
		};

		// Extract useful information based on event type
		if (eventKey.startsWith('jira:issue_') || eventKey.includes('issue')) {
			// Issue events
			if (bodyData.issue) {
				webhookData.issue = bodyData.issue;
			}
			if (bodyData.user) {
				webhookData.user = bodyData.user;
			}
			if (bodyData.changelog) {
				webhookData.changelog = bodyData.changelog;
			}
		} else if (eventKey.includes('comment')) {
			// Comment events
			if (bodyData.comment) {
				webhookData.comment = bodyData.comment;
			}
			if (bodyData.issue) {
				webhookData.issue = bodyData.issue;
			}
			if (bodyData.user) {
				webhookData.user = bodyData.user;
			}
		} else if (eventKey.includes('project')) {
			// Project events
			if (bodyData.project) {
				webhookData.project = bodyData.project;
			}
			if (bodyData.user) {
				webhookData.user = bodyData.user;
			}
		} else if (eventKey.includes('version')) {
			// Version events
			if (bodyData.version) {
				webhookData.version = bodyData.version;
			}
			if (bodyData.project) {
				webhookData.project = bodyData.project;
			}
			if (bodyData.user) {
				webhookData.user = bodyData.user;
			}
		} else if (eventKey.includes('user')) {
			// User events
			if (bodyData.user) {
				webhookData.user = bodyData.user;
			}
		}

		returnData.push(webhookData);

		return {
			workflowData: [
				this.helpers.returnJsonArray(returnData),
			],
		};
	}
}

// Helper function to make API requests for loadOptions in trigger node
async function makeApiRequestForTriggerOptions(
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
