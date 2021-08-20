function xhrPost(url, data) {
	return fetch(url, {
		method: "POST",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
}

export async function setAllQuestions({ categoryId, roundValue, gameSessionId }) {
	const response = await xhrPost(`/setAllQuestions`, { categoryId, roundValue, gameSessionId });
	return response.text();
}
