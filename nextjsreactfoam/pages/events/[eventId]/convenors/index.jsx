import { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import DelegateDashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Widget from "@/components/ui/Widget";
import Icon from "@/components/ui/Icon";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import eventTypes from "@/constants/eventTypes";
import {
  DelegateDashboardProvider,
  useDelegateDashboardDispatch,
} from "@/contexts/DelegateDashboardContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import Link from "next/link";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import withProvider from "@/components/hocs/withProvider";
import { useGlobalDispatch } from "@/contexts/GlobalContext";

const Convenor = ({ event, session }) => {
  const globalDispatch = useGlobalDispatch();
  const router = useRouter();
  // const delegateDashboardDispatch = useDelegateDashboardDispatch();

  const t = useTranslations();

  const eventStats = [
    {
      key: "registration_completed",
      title: t("common.registrationCompleted"),
      color: "teal",
      icon: "check",
    },
    {
      key: "awaiting_payment",
      title: t("common.awaitingPayment"),
      color: "orange",
      icon: "spinner",
    },
    {
      key: "social_funtions",
      title: t("common.socialFuntions"),
      color: "green",
      icon: "users",
      number: event?.incomplete_registrations_count,
    },
    {
      key: "accomodation_booked",
      title: t("common.accomodationBooked"),
      color: "purple",
      icon: "archway",
      number: event?.accommodation_nights_count,
    },
  ];
  const eventStats2 = [
    {
      key: "visit_the_mobile_app",
      title: t("common.mobileApp"),
      color: "blue",
      icon: "tv",
      number: false,
      link: "http://test.com",
      linkText: "Download the App",
    },
    {
      key: "connect_with_social_media",
      title: t("common.connectSocialMedia"),
      color: "orange",
      icon: "comments",
      number: false,
      link: "http://test.com",
      linkText: "Connect with Social Media",
    },
  ];

  const registrationItemsPanelToolbar = (
    <Button color="success" size="xs">
      Edit
    </Button>
  );
  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  // useEffect(() => {
  //   delegateDashboardDispatch({
  //     type: actionTypes.SET_EVENT,
  //     payload: event,
  //   });
  // }, [event]);
  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);
  return (
    <ContentErrorBoundary>
      <PageHeader title="Convenor" />

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
      <div
        className="d-lg-flex flex-nowrap justify-content-between"
        style={{ gap: "12px" }}
      >
        {eventStats2.map(({ key, ...stat }) => (
          <div key={key} className="flex-grow-1 eventWidget">
            <Widget.Stat {...stat} />
          </div>
        ))}
      </div>
      <hr className="m-t-0 bg-black-transparent-1" />

      {/* RegistrationItems and  Addons*/}
      <div className="row">
        <div className="col-md-6">
          <Panel
            title="Registration Items"
            color="inverse"
            toolbar={registrationItemsPanelToolbar}
          ></Panel>
        </div>
        <div className="col-md-6">
          <Panel
            title={t("common.addon", { entries: 2 })}
            color="inverse"
            maximizable
            collapsable
          ></Panel>
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

Convenor.authorized = true;
Convenor.Layout = DelegateDashboardLayout;

export default Convenor;
