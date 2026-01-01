export function submitTransferForm(
    code: string,
    state: string,
    targetUrl: string
): void {
    sessionStorage.setItem("transfer_code", code);
    sessionStorage.setItem("transfer_state", state);

    const form = document.createElement("form");
    form.method = "GET";
    form.action = `${targetUrl}/auth/transfer`;

    const codeInput = document.createElement("input");
    codeInput.type = "hidden";
    codeInput.name = "code";
    codeInput.value = code;
    form.appendChild(codeInput);

    const stateInput = document.createElement("input");
    stateInput.type = "hidden";
    stateInput.name = "state";
    stateInput.value = state;
    form.appendChild(stateInput);

    document.body.appendChild(form);

    form.submit();
}

