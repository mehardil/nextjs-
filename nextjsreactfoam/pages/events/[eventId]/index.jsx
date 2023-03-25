import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserRegistrationAccommodationWidget from "@/components/common/UserRegistrationAccommodationWidget";
import UserRegistrationAddonsWidget from "@/components/common/UserRegistrationAddonsWidget";
import UserRegistrationQuestionAnswersWidget from "@/components/common/UserRegistrationQuestionAnswersWidget";
import UserRegistrationMembershipWidget from "@/components/common/UserRegistrationMembershipsWidget";
import UserRegistrationDetailsWidget from "@/components/common/UserRegistrationDetailsWidget";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Widget from "@/components/ui/Widget";
import Icon from "@/components/ui/Icon";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const EventsDashboard = ({ event, registration, session }) => {
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();

  const eventStats = [
    {
      key: "register",
      title: t("common.register"),
      color: "teal",
      icon: "registered",
      link: `/events/${event?.id}/register`,
      linkText: "Register",
      show: !!!registration,
    },
    {
      key: "review_an_abstract",
      title: t("common.reviewAnAbstract"),
      color: "green",
      icon: "star",
      link: `/events/${event?.id}/reviews`,
      linkText: "Review",
      show: true,
    },
    {
      key: "submit_an_abstract",
      title: t("common.submitAnAbstract"),
      color: "orange",
      icon: "book",
      link: `/events/${event?.id}/reviews`,
      linkText: "Submit",
      show: true,
    },
  ];

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
      <PageHeader title="Registration" />
      <div
        className="d-lg-flex flex-nowrap justify-content-between"
        style={{ gap: "12px" }}
      >
        {eventStats.map(({ key, ...stat }) => (
          <div key={key} className="flex-grow-1">
            <Widget.Stat {...stat} />
          </div>
        ))}
      </div>
      {registration && (
        <>
          <hr className="m-t-0  bg-black-transparent-1" />
          <div className="row">
            <div className="col-md-4">
              <UserRegistrationDetailsWidget {...{ registration }} />
              <UserRegistrationMembershipWidget {...{ registration }} />
            </div>
            <div className="col-md-4">
              <UserRegistrationAccommodationWidget {...{ registration }} />
              <UserRegistrationQuestionAnswersWidget {...{ registration }} />
            </div>
            <div className="col-md-4">
              <UserRegistrationAddonsWidget {...{ registration }} />
            </div>
          </div>
        </>
      )}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  let event;
  let registration;
  let props;

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    /**
     * This is to prevent from getting a not found even without
     * a registration record.
     */
    const registrationResponse = await api({
      url: `/events/${context.params.eventId}/registrations?withEventData=1&withEventAddonPagesData=1&user=${session?.user?.id}`,
      headers,
    });

    registration = registrationResponse?.data?.data[0];

    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      props = {
        session,
        context: await getContextProps(context),
        event: eventResponse.data.data,
      };

      if (registration) {
        props = {
          ...props,
          registration,
        };
      }

      return {
        props,
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

EventsDashboard.authorized = true;
EventsDashboard.Layout = DashboardLayout;

export default EventsDashboard;
