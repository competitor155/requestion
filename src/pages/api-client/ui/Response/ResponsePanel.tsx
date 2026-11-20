import { useId, type FC } from 'react';

import { SendStateTypes, type SendState } from '../../model/sendState.ts';

import { useTranslation } from '#shared/i18n';
import { Flex, Spaces, Spinner } from '#shared/ui';

import { ResponseContent } from './ResponseContent.tsx';
import styles from './ResponsePanel.module.css';

interface ResponsePanelProps {
    /** Where the request of the tab stands */
    sendState: SendState;
    /** Asks for access to the host and sends the request again */
    onAccessRequest: VoidFunction;
}

/** The spinner sits next to the title, so waiting never changes the height of the panel */
export const ResponsePanel: FC<ResponsePanelProps> = ({ sendState, onAccessRequest }) => {
    const titleId = useId();
    const { t } = useTranslation();

    const isSending = sendState.stateType === SendStateTypes.SENDING;

    return (
        <section aria-labelledby={titleId} className={styles.panel}>
            <Flex align='center' gap={Spaces.S}>
                <h2 className={styles.title} id={titleId}>
                    {t('apiClientResponse')}
                </h2>

                {isSending && (
                    <Flex aria-label={t('apiClientResponseWaiting')} role='status'>
                        <Spinner />
                    </Flex>
                )}
            </Flex>

            <ResponseContent sendState={sendState} onAccessRequest={onAccessRequest} />
        </section>
    );
};
