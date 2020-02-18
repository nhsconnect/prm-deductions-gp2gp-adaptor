import moment from 'moment';
import uuid from 'uuid/v4';
import config from '../config';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { generateContinueRequest } from '../templates/continue-template';
import { storeMessageInEhrRepo } from './ehr-repo-gateway';
import {
  containsNegativeAcknowledgement,
  EHR_EXTRACT_MESSAGE_ACTION,
  extractAction,
  extractConversationId,
  extractFoundationSupplierAsid,
  extractMessageId
} from './message-parser';
import * as mhsGateway from './mhs-gateway';
import * as mhsGatewayFake from './mhs-gateway-fake';

const sendContinueMessage = async (message, messageId) => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const foundationSupplierAsid = await extractFoundationSupplierAsid(message);
  const continueRequest = generateContinueRequest(
    uuid(),
    timestamp,
    foundationSupplierAsid,
    config.deductionsAsid,
    messageId
  );

  return config.isPTL
    ? mhsGateway.sendMessage(continueRequest)
    : mhsGatewayFake.sendMessage(continueRequest).catch(err => {
        updateLogEventWithError(err);
        return Promise.reject(err);
      });
};

const handleMessage = async message => {
  updateLogEvent({ status: 'handling-message' });
  const startTag = '<SOAP-ENV:Envelope';
  const envelopeStartIndex = message.indexOf(startTag);
  message = message.slice(envelopeStartIndex);
  const conversationId = await extractConversationId(message);
  const messageId = await extractMessageId(message);
  const action = await extractAction(message);
  const isNegativeAcknowledgement = await containsNegativeAcknowledgement(message);

  updateLogEvent({
    message: {
      conversationId,
      messageId,
      action,
      isNegativeAcknowledgement
    }
  });

  if (isNegativeAcknowledgement) {
    updateLogEvent({ status: 'handling negative acknowledgement' });
    throw new Error('Message is a negative acknowledgement');
  }

  await storeMessageInEhrRepo(message, conversationId, messageId);
  await updateLogEvent({ status: 'store message to ehr repo' });

  if (action === EHR_EXTRACT_MESSAGE_ACTION) {
    await updateLogEvent({ status: 'sending continue message' });
    await sendContinueMessage(message, messageId);
  }
};

export default handleMessage;
