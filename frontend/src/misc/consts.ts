export const version = 'v0.2.21'

export const models = [
	{
		name: 'mistral',
		fullname: 'Mistral 7B',
		chatname: 'Mistral 7B',
		description: 'Mistral-7B-v0.2 Large Language Model (LLM) is a pretrained generative text model with 7 billion parameters by Mistral AI. '
	},
	{
		name: 'mixtral',
		fullname: 'Mixtral 8x7B',
		chatname: 'Mixtral',
		description: 'The Mixtral-8x7B Large Language Model (LLM) is a pretrained generative Sparse Mixture of Experts. It outperforms Llama 2 70B on many benchmarks.'
	},
	{
		name: 'dolphin-mixtral',
		fullname: 'Dolphin Mixtral (dolphin-2.5-mixtral-8x7b)',
		chatname: 'Dolphin Mixtral',
		description: 'The Dolphin-Mixtral Large Language Model (LLM) is a pretrained generative Sparse Mixture of Experts. Is\'s an uncensored, fine-tuned model based on the Mixtral model that excels at coding tasks. This model is uncensored, and you are solely responsible for any content created using this model. Read more here: https://erichartford.com/uncensored-models . '
	},
]

export const modelOptions = models.map((model) => {
	return {
		label: model.fullname,
		value: model.name,
	}
});