import {
    apiClientDatabase,
    historyStore,
    mapResponseToSummary,
    mergeRepeatedEntry,
    type ApiRequest,
    type ApiResponse,
    type HistoryEntry,
} from '#entities/request';
import { API_CLIENT_CONFIG } from '#shared/config';
import { getRandomUUID } from '#shared/lib';
import { readNewestRecord, trimRecords, writeRecord } from '#shared/platform';

export const buildHistoryEntry = (
    request: ApiRequest,
    sentAt: number,
    response: NotRequired<ApiResponse>,
): HistoryEntry => {
    const entry = {
        id: getRandomUUID(),
        sentAt,
        request,
    };

    if (response === undefined) {
        return entry;
    }

    return {
        ...entry,
        response: mapResponseToSummary(response),
    };
};

export const addHistoryEntry = async (entry: HistoryEntry): Promise<void> => {
    const lastEntry = await readNewestRecord(apiClientDatabase, historyStore);

    await writeRecord(apiClientDatabase, historyStore, mergeRepeatedEntry(entry, lastEntry));

    await trimRecords(apiClientDatabase, historyStore, API_CLIENT_CONFIG.HISTORY_LIMIT);
};
