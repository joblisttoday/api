

import personioApi from '@joblist/job-board-providers/src/apis/personio.js'
import recruiteeApi from '@joblist/job-board-providers/src/apis/recruitee.js'
import greenhouseApi from '@joblist/job-board-providers/src/apis/greenhouse.js'
import smartrecruitersApi from '@joblist/job-board-providers/src/apis/smartrecruiters.js'
import ashbyApi from '@joblist/job-board-providers/src/apis/ashby.js'
import leverApi from '@joblist/job-board-providers/src/apis/lever.js'
import workableApi from '@joblist/job-board-providers/src/apis/workable.js'

export type ProviderType = {
	id: String,
	getJobs: Function,
}

export const providers: ProviderType[] = [
	workableApi,
	leverApi,
	ashbyApi,
	smartrecruitersApi,
	greenhouseApi,
	recruiteeApi,
	personioApi,
]

export const providerIds = providers.map((provider: ProviderType) => provider.id)

export const providersMap = {}
providers.forEach((provider: ProviderType) => {
	providersMap[provider.id] = provider
})
