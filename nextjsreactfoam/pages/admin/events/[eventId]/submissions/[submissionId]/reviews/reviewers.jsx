import React, { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import Link from "next/link";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventSubmissionReviewersTable from "@/components/common/EventSubmissionReviewersTable";
import PageHeader from "@/components/common/PageHeader";
import ViewEventSubmissionLayout from "@/components/layouts/ViewEventSubmissionLayout";
import EventReviewReviewerModal from "@/components/modals/EventReviewReviewerModal";
import classNames from "classnames";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import NavTabs from "@/components/ui/NavTabs";
import Panel from "@/components/ui/Panel";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import apiPaths, { EVT_SUBMISSION_REVIEW_STAGE_REVIEWERS } from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const loopNestedCategories = (categories) =>
  categories?.reduce((mappedCategories, currentCategory) => {
    return [
      ...mappedCategories,
      {
        title: currentCategory?.name,
        key: `AbstraktCategory-${currentCategory?.id}`,
        children: loopNestedCategories(currentCategory.children),
      },
    ];
  }, []);

const EventSubmissionReviwersPage = ({
  event,
  submission,
  context,
  stages,
  reviewers,
  submissions,
  meta,
  session,
  headers,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const eventDispatch = useEventDispatch();
  const [activeReviewer, setActiveReviewer] = useState();
  const [isReviewerModalOpen, setReviewerModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const activeReviewStageId = context.query.reviewStageId
    ? parseInt(context.query.reviewStageId)
    : stages?.[0]?.id;

  const pageHeaderToolbar = (
    <Button
      isRounded
      color="primary"
      onClick={() => {
        setActiveReviewer(undefined);
        setReviewerModalOpen(true);
      }}
    >
      <Icon icon="plus" className="mr-2" />
      {t("common.forms.addEntity", {
        entity: t("common.reviewReviewer", { entries: 1 }),
      })}
    </Button>
  );

  const reviewStagePages = stages.map((stage) => ({
    ...stage,
    link: interpolatePath(paths.ADMIN_EVT_REVIEWS_REVIEWERS, {
      eventId: event?.id,
      submissionId: submission?.id,
      query: {
        reviewStageId: stage?.id,
      },
    }),
  }));

  /**
   * Prepares and formats the submissions (AbstraktSociety) and
   * categories (AbstraktCategory) into a nested structure.
   * Calls "loopNestedCategories" to loop through AbstraktCategory children.
   *
   * @var array
   */
  const mappedSubmissionTree = submissions.reduce(
    (mappedArray, currentSubmission) => {
      return [
        ...mappedArray,
        {
          title: currentSubmission?.name,
          key: `AbstraktSociety-${currentSubmission?.id}`,
          children: loopNestedCategories(currentSubmission.categories),
        },
      ];
    },
    []
  );

  const CustomTab = (reviewStage) => (
    <li className="nav-item">
      <Link href={reviewStage?.link}>
        <a
          className={classNames("nav-link", {
            show: context.query.reviewStageId == reviewStage?.id,
            active: reviewStage?.id === activeReviewStageId,
          })}
        >
          <span className="d-sm-inline-block">{reviewStage?.name}</span>
        </a>
      </Link>
    </li>
  );

  const CustomContent = () => {
    return (
      <EventSubmissionReviewersTable
        items={reviewers}
        onEdit={handleReviewerEdit}
        onDelete={handleReviewerDelete}
        initialPage={meta.current_page}
        numOfPages={meta.last_page}
        totalItems={meta.total}
        from={meta.from}
        to={meta.to}
      />
    );
  };

  const onSubmit = async (reviewerData) => {
    setIsSaving(true);

    const notifSuccess = activeReviewer
      ? "common.notifs.successfullyUpdated"
      : "common.notifs.successfullySaved";

    const notifFail = activeReviewer
      ? "common.notifs.failedToUpdate"
      : "common.notifs.failedToSave";

    try {
      const url = activeReviewer
        ? apiPaths.EVT_SUBMISSION_REVIEW_STAGE_REVIEWER
        : apiPaths.EVT_SUBMISSION_REVIEW_STAGE_REVIEWERS;

      const requestBody = requestParamBuilder(reviewerData);

      const reviewerResponse = await api({
        headers,
        method: activeReviewer ? "PUT" : "POST",
        data: requestBody,
        url: interpolatePath(url, {
          eventId: event?.id,
          submissionId: submission?.id,
          reviewStageId: activeReviewStageId,
          reviewerId: activeReviewer?.user,
        }),
      });

      addToast(
        t(notifSuccess, {
          entityName: reviewerData?.name,
          entity: t("common.reviewReviewer", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.replace(router.asPath);
    } catch (e) {
      addToast(
        t(notifFail, {
          entityName: reviewerData?.name,
          entity: t("common.reviewReviewer", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewerEdit = (reviewerData) => {
    setActiveReviewer(reviewerData);
    setReviewerModalOpen(true);
  };

  const handleReviewerDelete = (reviewerData) => {
    setActiveReviewer(reviewerData);
    setShowDeleteConfirm(true);
  };

  const onConfirmDelete = async () => {
    try {
      const data = await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.EVT_SUBMISSION_REVIEW_STAGE_REVIEWER, {
          eventId: event?.id,
          submissionId: submission?.id,
          reviewStageId: context.query.reviewStageId,
          reviewerId: activeReviewer?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: "",
          entity: t("common.reviewReviewer", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      router.replace(router.asPath);
    } catch (e) {
      addToast(
        t("common.notifs.failedToDelete", {
          entityName: "",
          entity: t("common.reviewReviewer", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, eventDispatch]);

  /**
   * Sets the submission to be used for the entire submission-related pages.
   * This must be implemented in every submission page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_SUBMISSION,
      payload: submission,
    });
  }, [eventDispatch, submission]);

  return (
    <ContentErrorBoundary>
      <PageHeader
        title={t("common.reviewReviewer", { entries: 2 })}
        toolbar={pageHeaderToolbar}
      />
      {isReviewerModalOpen && (
        <EventReviewReviewerModal
          isShow={isReviewerModalOpen}
          isSaving={isSaving}
          onSubmit={onSubmit}
          defaultValues={activeReviewer}
          categoryTreeData={mappedSubmissionTree}
          onHide={() => {
            setActiveReviewer(undefined);
            setReviewerModalOpen(false);
          }}
        />
      )}
      {showDeleteConfirm && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText={t("common.forms.delete")}
          confirmBtnBsStyle="danger"
          title={t("common.forms.deleteConfirmation")}
          focusCancelBtn
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setActiveReviewer(undefined);
            setShowDeleteConfirm(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: "",
            entity: t("common.reviewReviewer", { entries: 1 }),
          })}
        </PopupAlert>
      )}
      <NavTabs
        tabs={reviewStagePages}
        paneled
        inverse
        components={{
          Tab: CustomTab,
          Content: CustomContent,
        }}
      />
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const reviewStagesResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSION_REVIEW_STAGES, {
            eventId: pipeProps?.event?.id,
            submissionId: pipeProps?.submission?.id,
          }),
        });

        const reviewersResponse = await api({
          headers,
          url: interpolatePath(apiPaths.USERS, {
            query: {
              page: context.query.page || 1,
              include: "abstraktReviewers",
              hasReviewerRoles: 1,
              reviewer_stage:
                context.query.reviewStageId ||
                reviewStagesResponse?.data?.data?.[0]?.id,
            },
          }),
        });

        const submissionsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSIONS, {
            eventId: pipeProps?.event?.id,
            submissionId: pipeProps?.submission?.id,
            query: {
              includeNestedCategories: 1,
            },
          }),
        });

        return {
          props: {
            headers,
            session,
            ...pipeProps,
            context: await getContextProps(context),
            stages: reviewStagesResponse.data.data,
            submissions: submissionsResponse.data.data,
            reviewers: reviewersResponse.data.data,
            meta: reviewersResponse.data.meta,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

EventSubmissionReviwersPage.authorized = true;
EventSubmissionReviwersPage.allowedRoles = [ADMIN];
EventSubmissionReviwersPage.Layout = ViewEventSubmissionLayout;
EventSubmissionReviwersPage.defaultProps = {
  stages: [],
  reviewers: [],
};

export default EventSubmissionReviwersPage;
