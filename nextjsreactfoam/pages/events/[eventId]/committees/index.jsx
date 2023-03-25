import { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import EventDetailsWidget from "@/components/common/EventDetailsWidget";
import EventRegistrationCountWidget from "@/components/common/EventRegistrationCountWidget";
import EventIncompleteRegistrationCountWidget from "@/components/common/EventIncompleteRegistrationCountWidget";
import EventAccommodationsCountWidget from "@/components/common/EventAccommodationsCountWidget";
import EventTechnicalSubmissionsCountWidget from "@/components/common/EventTechnicalSubmissionsCountWidget";
import EventInvitedSpeakersCountWidget from "@/components/common/EventInvitedSpeakersCountWidget";
import EventLitReviewsCountWidget from "@/components/common/EventLitReviewsCountWidget";
import EventEncouragementAwardsCountWidget from "@/components/common/EventEncourageAwardsCountWidget";
import EventStatRegistrations from "@/components/common/EventStatRegistrations";
import EventStatAttendeeTypes from "@/components/common/EventStatAttendeeTypes";
import EventStatAddons from "@/components/common/EventStatAddons";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DelegateCommitteeHeader from "@/components/common/DelegateCommitteeHeader";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Widget from "@/components/ui/Widget";
import Icon from "@/components/ui/Icon";
import eventTypes from "@/constants/eventTypes";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import localizeDate from "@/utils/localizeDate";

const CommitteeOverview = ({ event, session }) => {
  const router = useRouter();
  const globalDispatch = useGlobalDispatch();
  const t = useTranslations();

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Committee" />
      <EventDetailsWidget {...{ event }} />
      <div className="row row-space-12">
        <div className="col-md-3">
          <EventRegistrationCountWidget {...{ event }} />
          <EventIncompleteRegistrationCountWidget {...{ event }} />
        </div>
        <div className="col-md-3">
          <EventAccommodationsCountWidget {...{ event }} />
          <EventInvitedSpeakersCountWidget {...{ event }} />
        </div>
        <div className="col-md-3">
          <EventTechnicalSubmissionsCountWidget {...{ event }} />
          <EventLitReviewsCountWidget {...{ event }} />
        </div>
        <div className="col-md-3">
          <EventEncouragementAwardsCountWidget {...{ event }} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
          <EventStatRegistrations {...{ event }} />
        </div>
        <div className="col-md-4">
          <EventStatAttendeeTypes {...{ event }} />
        </div>
        <div className="col-md-4">
          <EventStatAddons {...{ event }} />
        </div>
      </div>
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

CommitteeOverview.authorized = true;
CommitteeOverview.Layout = DashboardLayout;

export default CommitteeOverview;
