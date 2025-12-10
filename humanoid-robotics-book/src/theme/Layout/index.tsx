import React, {type ReactNode} from 'react';
import Layout from '@theme-original/Layout';
import type LayoutType from '@theme/Layout';
import type {WrapperProps} from '@docusaurus/types';
import Chatbot from '@site/src/components/Chatbot';
import { AuthProvider } from '@site/src/contexts/AuthContext';
import { ChatbotProvider } from '@site/src/contexts/ChatbotContext';

type Props = WrapperProps<typeof LayoutType>;

export default function LayoutWrapper(props: Props): ReactNode {
  return (
    <AuthProvider>
      <ChatbotProvider>
        <Layout {...props} />
        <Chatbot />
      </ChatbotProvider>
    </AuthProvider>
  );
}
