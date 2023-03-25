import { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import DelegateDashboardLayout from "@/components/layouts/DelegateDashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DelegateConvenorInvitedSpeakersHeader from "@/components/common/DelegateConvenorInvitedSpeakersHeader";
import eventTypes from "@/constants/eventTypes";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import Link from "next/link";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import ConvenorsOverview from "@/components/common/ConvenorsOverview";

const ConvenorInvitedSpeakers = ({ event, session }) => {
  const router = useRouter();
  const delegateDashboardDispatch = useDelegateDashboardDispatch();

  const t = useTranslations();

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    delegateDashboardDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);
  return (
    <ContentErrorBoundary>
      <PageHeader
        title="Invited Speakers"
        description={<DelegateConvenorInvitedSpeakersHeader />}
      />
      <ConvenorsOverview event={event} session={session} />
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: response.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

ConvenorInvitedSpeakers.authorized = true;
ConvenorInvitedSpeakers.Layout = DelegateDashboardLayout;

export default ConvenorInvitedSpeakers;
