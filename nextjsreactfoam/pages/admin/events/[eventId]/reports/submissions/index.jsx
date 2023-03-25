import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import SubmissionsReportHeader from "@/components/common/SubmissionsReportHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import Widget from "@/components/ui/Widget";
import localizeDate from "@/utils/localizeDate";
import Link from "next/link";
import paths from "@/routes/paths";

const SubmissionsReport = ({ event, session }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [categoriesStats, setCategoriesStats] = useState({
    categories_counts: [],
  });
  const eventStats = [
    {
      key: "completed_submissions",
      title: t("common.completedSubmissions"),
      color: "teal",
      icon: "users",
      number: event?.user_submissions_count,
      link: "http://test.com",
    },
    {
      key: "incompleted_submissions",
      title: t("common.incompletedSubmissions"),
      color: "red",
      icon: "times",
      number: event?.unchecked_registrations_count,
      link: "http://test.com",
    },
    {
      key: "withdrawn_submissions",
      title: t("common.withdrawnSubmissions"),
      color: "orange",
      icon: "exclamation",
      number: event?.incomplete_registrations_count,
      link: "http://test.com",
    },
    {
      key: "numbers_of_submissions_with_no_reviews",
      title: t("common.numbersOfSubmissionsWithNoReviews"),
      color: "blue",
      icon: "arrow-alt-circle-right",
      number: event?.user_submissions_count,
      link: "http://test.com",
    },
  ];
  /**
   * Created a function to request for categories stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Categories Stats is clicked.
   */
  const loadCategoriesStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/submission-categories`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setCategoriesStats(response.data.data);
  };
  /**
   * This useEffect will load all chart-related requests
   * initially. Will be called once.
   */
  useEffect(() => {
    loadCategoriesStats();
  }, []);
  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <SubmissionsReportHeader />
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
      <hr className="m-t-0 bg-black-transparent-1" />

      <div className="row">
        <div className="col-md-6">
          <Panel
            title={t("common.submissionCategories")}
            color="inverse"
            collapsable
          >
            {categoriesStats.categories_counts && (
              <div className="list-group">
                {Object.entries(categoriesStats.categories_counts).map(
                  ([key, category]) => (
                    <div
                      key={key}
                      className="list-group-item d-flex justify-content-between align-items-center text-ellipsis"
                    >
                      {key}
                      <span className="badge f-w-500 bg-gradient-teal f-s-10">
                        {category.count}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </Panel>
        </div>
        <div className="col-md-6">
          <Panel
            title={t("common.decisions")}
            color="inverse"
            collapsable
          ></Panel>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <Panel
            title={t("common.reviewStage", { entries: 1 })}
            color="inverse"
            collapsable
          ></Panel>
        </div>
      </div>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
        },
      };
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
}

SubmissionsReport.Layout = ViewEventLayout;

export default SubmissionsReport;
