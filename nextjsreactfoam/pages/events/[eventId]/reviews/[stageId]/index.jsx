import React, { useEffect } from "react";
import Link from "next/link";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ReviewStageTabs from "@/components/common/ReviewStageTabs";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Widget from "@/components/ui/Widget";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const StageReviewsDashboard = ({
  stages,
  stage,
  reviews,
  event,
  context,
  session,
}) => {
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const stageStats = [
    {
      key: "reviews",
      title: t("common.review", { entries: 2 }),
      color: "teal",
      icon: "check",
      number: stage?.reviews_count,
    },
    {
      key: "pending_reviews",
      title: "Pending Reviews",
      color: "black",
      icon: "clock",
      number: stage?.pending_reviews,
    },
    {
      key: "unreviews",
      title: "Num Unreviewed",
      color: "orange",
      icon: "exclamation-triangle",
      number: stage?.unreviewed_count,
    },
  ];

  const columns = [
    { key: "id", label: "ID" },
    { key: "abstrakt_number", label: "No." },
    { key: "title", label: "Description" },
    { key: "status", label: "Status" },
    { key: "date_added", label: "Review Submitted" },
    { key: "actions", label: "Action" },
  ];

  const scopedSlots = {
    abstrakt_number: ({ user_submission }) => (
      <>{user_submission?.abstrakt_number}</>
    ),
    title: ({ user_submission }) => <>{user_submission?.title}</>,
    status: ({ status }) => <>{status}</>,
    actions: ({ id }) => (
      <Link
        href={{
          pathname: paths.DELEGATE_REVIEW_STAGE_REVIEW_EDIT,
          query: {
            eventId: event?.id,
            stageId: stage?.id,
            reviewId: id,
          },
        }}
        passHref
      >
        <Button tag="a" size="xs" color="white">
          Edit Review
        </Button>
      </Link>
    ),
  };

  const pageHeaderToolbar = (
    <Link
      href={{
        pathname: paths.DELEGATE_REVIEW_STAGE_REVIEW,
        query: { eventId: event?.id, stageId: stage?.id },
      }}
      passHref
    >
      <Button tag="a" color="primary" isCircle>
        Review <i>"{stage?.name}"</i> Now
      </Button>
    </Link>
  );

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
      <PageHeader
        title="Reviews"
        toolbar={pageHeaderToolbar}
        description={<ReviewStageTabs {...{ stages, eventId: event?.id }} />}
      />
      <div className="row row-space-10">
        {stageStats.map(({ key, ...stat }) => (
          <div key={key} className="col-md-4">
            <Widget.Stat {...stat} />
          </div>
        ))}
      </div>
      <Panel title="Review Submissions" color="inverse" maximizable collapsable>
        <Table items={reviews} columns={columns} scopedSlots={scopedSlots} />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const stagesResponse = await api({
        url: `/user-submission-stages?event=${context.params.eventId}&user=${session.user.id}`,
        headers,
      });

      const stageResponse = await api({
        url: `/user-submission-stages/${context.params.stageId}?withBasicStats=1`,
        headers,
      });

      const userSubmissionReviews = await api({
        url: `user-submission-reviews?withUserSubmissionData=1&stage=${context.params.stageId}&user=${session?.user?.id}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          stages: stagesResponse.data.data,
          stage: stageResponse.data.data,
          reviews: userSubmissionReviews.data.data,
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
};

StageReviewsDashboard.authorized = true;
StageReviewsDashboard.Layout = DashboardLayout;

export default StageReviewsDashboard;
