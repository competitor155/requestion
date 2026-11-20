import { describe, expect, it } from '@rstest/core';

import {
    getNextSendState,
    IDLE_STATE,
    SENDING_STATE,
    SendStateTypes,
    TIMED_OUT_STATE,
    type SendState,
} from '../sendState.ts';

import { makeResponse } from './mocks.ts';

const RESPONSE = makeResponse();

const RECEIVED_STATE: SendState = { stateType: SendStateTypes.RECEIVED, response: RESPONSE };

const RESENDING_STATE: SendState = { stateType: SendStateTypes.SENDING, previous: RESPONSE };

describe('getNextSendState', () => {
    it('keeps the last response on the screen while the request goes again', () => {
        expect(getNextSendState(RECEIVED_STATE, SENDING_STATE)).toEqual(RESENDING_STATE);
    });

    it('shows the last response again when the request is cancelled', () => {
        expect(getNextSendState(RESENDING_STATE, IDLE_STATE)).toEqual(RECEIVED_STATE);
    });

    it.each([
        { name: 'the first sending', current: IDLE_STATE, next: SENDING_STATE },
        { name: 'a cancel of the first sending', current: SENDING_STATE, next: IDLE_STATE },
        { name: 'a timeout after the last response', current: RESENDING_STATE, next: TIMED_OUT_STATE },
    ])('takes the next state as it is on $name', ({ current, next }) => {
        expect(getNextSendState(current, next)).toBe(next);
    });
});
