import { describe, expect, it } from '@rstest/core';

import { RequestBodyTypes } from '#entities/request';
import { HttpMethods } from '#shared/lib';

import { buildApiRequest } from '../requestDraft.ts';
import {
    closeRequestTab,
    createRequestTabs,
    getActiveTab,
    openHistoryTab,
    openRequestTab,
    selectRequestTab,
    updateTabDraft,
    updateTabSendState,
    type RequestTabs,
} from '../requestTabs.ts';
import { SENDING_STATE } from '../sendState.ts';

import { makeDraft, makeRow } from './mocks.ts';

const SENT_REQUEST = buildApiRequest(
    makeDraft({
        method: HttpMethods.POST,
        url: 'https://api.example.com/users?page=2',
        query: [makeRow('page', '2')],
        headers: [makeRow('Accept', 'application/json')],
        bodyType: RequestBodyTypes.JSON,
        jsonBody: '{"name":"Ann"}',
    }),
);

/** Three tabs, the second one on the screen */
const makeThreeTabs = (): RequestTabs => {
    const opened = openRequestTab(openRequestTab(createRequestTabs()));
    const [, second] = opened.tabs;

    return selectRequestTab(opened, second?.draft.id ?? '');
};

const getIds = (state: RequestTabs): string[] => state.tabs.map(tab => tab.draft.id);

describe('request tabs', () => {
    it('start with one empty tab on the screen', () => {
        const state = createRequestTabs();

        expect(state.tabs).toHaveLength(1);

        expect(getActiveTab(state).draft.url).toBe('');
    });

    it('show a new tab at the end', () => {
        const state = openRequestTab(createRequestTabs());

        expect(state.activeId).toBe(getIds(state)[1]);
    });

    it('ignore a tab that is gone', () => {
        const state = createRequestTabs();

        expect(selectRequestTab(state, 'gone')).toBe(state);

        expect(closeRequestTab(state, 'gone')).toBe(state);
    });

    describe('closing', () => {
        it('shows the tab that takes the place of the active one', () => {
            const state = makeThreeTabs();
            const [, second, third] = getIds(state);

            expect(closeRequestTab(state, second ?? '').activeId).toBe(third);
        });

        it('shows the new last tab when the last one closes', () => {
            const state = makeThreeTabs();
            const [, second, third] = getIds(state);
            const lastShown = selectRequestTab(state, third ?? '');

            expect(closeRequestTab(lastShown, third ?? '').activeId).toBe(second);
        });

        it('keeps the active tab when another one closes', () => {
            const state = makeThreeTabs();
            const [first] = getIds(state);

            expect(closeRequestTab(state, first ?? '').activeId).toBe(state.activeId);
        });

        it('opens an empty tab after the last one', () => {
            const state = createRequestTabs();
            const nextState = closeRequestTab(state, state.activeId);

            expect(nextState.tabs).toHaveLength(1);

            expect(nextState.activeId).not.toBe(state.activeId);
        });
    });

    it('change only the tab with the id', () => {
        const state = makeThreeTabs();
        const [firstId = ''] = getIds(state);

        const edited = updateTabDraft(state, firstId, { url: 'https://a.test' });
        const nextState = updateTabSendState(edited, firstId, SENDING_STATE);

        expect(nextState.tabs[0]).toMatchObject({ draft: { url: 'https://a.test' }, sendState: SENDING_STATE });

        expect(nextState.tabs[1]).toBe(state.tabs[1]);
    });
});

describe('a request of the history', () => {
    it('brings the tab that holds it to the front', () => {
        const opened = openHistoryTab(createRequestTabs(), SENT_REQUEST);
        const [firstId = ''] = getIds(opened);
        const again = openHistoryTab(selectRequestTab(opened, firstId), SENT_REQUEST);

        expect(again.tabs).toHaveLength(2);

        expect(again.activeId).toBe(opened.activeId);
    });

    it('opens in a new tab once the tab that held it changes', () => {
        const opened = openHistoryTab(createRequestTabs(), SENT_REQUEST);
        const changed = updateTabDraft(opened, opened.activeId, { url: 'https://api.example.com/orders' });

        expect(openHistoryTab(changed, SENT_REQUEST).tabs).toHaveLength(3);
    });
});
