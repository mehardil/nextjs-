import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import capitalize from "lodash/capitalize";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ViewEventSubmissionLayout from "@/components/layouts/ViewEventSubmissionLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import Widget from "@/components/ui/Widget";
import localizeDate from "@/utils/localizeDate";
import paths from "@/routes/paths";
import interpolatePath from "@/utils/interpolatePath";

const SubmissionsReport = ({ event, submission, session }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const submissionLink = interpolatePath(
    paths.DELEGATE_SUBMISSIONS_SUBMIT_PROFILE,
    { eventId: event?.id, submissionId: submission?.id }
  );
  const [categoriesStats, setCategoriesStats] = useState({
    categories_counts: [],
  });
  const [stagesStats, setStagesStats] = useState({
    stages_counts: [],
  });
  const [presentationTypesStats, setPresentationTypesStats] = useState({
    presentation_types_counts: [],
  });

  const submissionStats = [
    {
      key: "completed_submissions",
      title: t("common.completedSubmissions"),
      color: "teal",
      icon: "check",
      number: submission?.completed_submissions_count,
    },
    {
      key: "incompleted_submissions",
      title: t("common.incompletedSubmissions"),
      color: "red",
      icon: "minus-circle",
      number: submission?.incomplete_submissions_count,
    },
    {
      key: "withdrawn_submissions",
      title: t("common.withdrawnSubmissions"),
      color: "orange",
      icon: "upload",
      number: submission?.removed_submissions_count,
    },
    {
      key: "numbers_of_submissions_with_no_reviews",
      title: t("common.numbersOfSubmissionsWithNoReviews"),
      color: "blue",
      icon: "eye-slash",
      number: submission?.unreviewed_submissions_count,
    },
  ];

  /**
   * Created a function to request for categories stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Categories Stats is clicked.
   */
  const loadCategoriesStats = async () => {
    const response = await api({
      url: `/events/${event.id}/submissions/${submission.id}/stats/categories`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setCategoriesStats(response.data.data);
  };

  /**
   * Created a function to request for stages stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Stages Stats is clicked.
   */
  const loadStagesStats = async () => {
    const response = await api({
      url: `/events/${event.id}/submissions/${submission.id}/stats/review-stages`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setStagesStats(response.data.data);
  };

  /**
   * Created a function to request for stages stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Stages Stats is clicked.
   */
  const loadPresentationTypesStats = async () => {
    const response = await api({
      url: `/events/${event.id}/submissions/${submission.id}/stats/presentation-types`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setPresentationTypesStats(response.data.data);
  };

  /**
   * This useEffect will load all chart-related requests
   * initially. Will be called once.
   */
  useEffect(() => {
    loadCategoriesStats();
    loadStagesStats();
    loadPresentationTypesStats();
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

  /**
   * Sets the submission to be used for the entire submission-related pages.
   * This must be implemented in every submission page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_SUBMISSION,
      payload: submission,
    });
  }, [submission]);

  return (
    <ContentErrorBoundary>
      <Panel
        title={t("common.summary")}
        color="inverse"
        maximizable
        collapsable
      >
        <div className="row">
          <div className="col-md-4">
            <div className="media">
              <div className="media-body">
                <h4 className="font-weight-bold media-heading">
                  {submission?.name}
                </h4>
                <h5 className="f-s-12 text-black-transparent-7">
                  {capitalize(submission?.type)}
                </h5>
                <b>{t("common.admin", { entries: 1 })}</b>
                {submission?.admin ? (
                  <p>
                    {`${submission?.admin?.first_name} ${submission?.admin?.last_name}`}
                  </p>
                ) : (
                  <p>{t("common.notSet")}</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <b>{t("common.forms.fields.submissionEnd")}</b>
            <p>
              {submission?.submission_end
                ? localizeDate(submission?.submission_end)
                : "Not set"}
            </p>
            <b>{t("common.forms.fields.editingEnd")}</b>
            <p>
              {submission?.editing_end
                ? localizeDate(submission?.editing_end)
                : "Not set"}
            </p>
            <b>{t("common.forms.fields.reviewingEnd")}</b>
            <p>
              {submission?.reviewing_end
                ? localizeDate(submission?.reviewing_end)
                : "Not set"}
            </p>
          </div>
          <div className="col-md-4">
            <b>
              {t("common.entityLink", {
                entity: t("common.submission", { entries: 1 }),
              })}
            </b>
            <p>
              <Link href={submissionLink}>
                <a>{`${window.location.origin}${submissionLink}`}</a>
              </Link>
            </p>
          </div>
        </div>
      </Panel>
      <div
        className="d-lg-flex flex-nowrap justify-content-between"
        style={{ gap: "12px" }}
      >
        {submissionStats.map(({ key, ...stat }) => (
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
            bodyless={!!categoriesStats.categories_counts}
            collapsable
          >
            {!!categoriesStats.categories_counts ? (
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
            ) : (
              <>No categories.</>
            )}
          </Panel>
        </div>
        <div className="col-md-6">
          <Panel
            title={t("common.decisions")}
            color="inverse"
            bodyless={!!presentationTypesStats.presentation_types_counts}
            collapsable
          >
            {!!presentationTypesStats.presentation_types_counts ? (
              <div className="list-group">
                {Object.entries(
                  presentationTypesStats.presentation_types_counts
                ).map(([key, presType]) => (
                  <div
                    key={key}
                    className="list-group-item d-flex justify-content-between align-items-center text-ellipsis"
                  >
                    {key}
                    <span className="badge f-w-500 bg-gradient-teal f-s-10">
                      {presType.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>No decisions.</>
            )}
          </Panel>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <Panel
            title={t("common.reviewStage", { entries: 1 })}
            color="inverse"
            bodyless={!!stagesStats.stages_counts}
            collapsable
          >
            {!!stagesStats.stages_counts ? (
              <div className="list-group">
                {Object.entries(stagesStats.stages_counts).map(
                  ([key, stage]) => (
                    <div
                      key={key}
                      className="list-group-item d-flex justify-content-between align-items-center text-ellipsis"
                    >
                      {key}
                      <span className="badge f-w-500 bg-gradient-teal f-s-10">
                        {stage.count}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <>No review stages.</>
            )}
          </Panel>
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

      const submissionResponse = await api({
        url: `/events/${context.params.eventId}/submissions/${context.params.submissionId}?withBasicStats=1`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          submission: submissionResponse.data.data,
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

SubmissionsReport.Layout = ViewEventSubmissionLayout;

export default SubmissionsReport;
