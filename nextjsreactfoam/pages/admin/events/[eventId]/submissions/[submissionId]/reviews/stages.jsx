import { useState, forwardRef, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventsReviewStagesTable from "@/components/common/EventsReviewStagesTable";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import ViewEventSubmissionLayout from "@/components/layouts/ViewEventSubmissionLayout";
import EventReviewStagesModal from "@/components/modals/EventReviewStagesModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const EventSubmissionReviewStagesPage = ({
  event,
  stages,
  submission,
  session,
  headers,
  meta,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const eventDispatch = useEventDispatch();
  const [activeReviewStage, setActiveReviewStage] = useState();
  const [isReviewStageModalOpen, setReviewStageModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isRounded
      onClick={() => {
        setReviewStageModalOpen(true);
      }}
    >
      <Icon icon="plus" className="mr-2" />
      {t("common.forms.addEntity", {
        entity: t("common.reviewStage", { entries: 1 }),
      })}
    </Button>
  );

  /**
   * Responsible for creating or updating event
   * submission review stages.
   *
   * @param {object} reviewStageData
   */
  const onSubmit = async (reviewStageData) => {
    setIsSaving(true);

    const requestBody = requestParamBuilder(reviewStageData);
    const url = activeReviewStage
      ? apiPaths.EVT_SUBMISSION_REVIEW_STAGE
      : apiPaths.EVT_SUBMISSION_REVIEW_STAGES;
    const notifSuccess = activeReviewStage
      ? "common.notifs.successfullyUpdated"
      : "common.notifs.successfullyCreated";
    const notifFail = activeReviewStage
      ? "common.notifs.failedToUpdate"
      : "common.notifs.failedToCreate";

    try {
      const response = await api({
        headers,
        method: activeReviewStage ? "PUT" : "POST",
        data: requestBody,
        url: interpolatePath(url, {
          eventId: event?.id,
          submissionId: submission?.id,
          reviewStageId: activeReviewStage?.id,
        }),
      });

      addToast(
        t(notifSuccess, {
          entityName: reviewStageData?.name,
          entity: t("common.reviewStage", { entries: 1 }),
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
          entityName: reviewStageData?.name,
          entity: t("common.reviewStage", { entries: 1 }),
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

  /**
   * Prepares the review stage to be edited and sets
   * it as the active review stage. Opens the create/update modal after.
   *
   * @param {object} reviewStageData
   */
  const handleReviewStageEdit = (reviewStageData) => {
    setActiveReviewStage(reviewStageData);
    setReviewStageModalOpen(true);
  };

  /**
   * Prepares the review stage to be deleted. Displays a confirmation
   * popup modal.
   *
   * @param {object} reviewStageData
   */
  const handleReviewStageDelete = (reviewStageData) => {
    setActiveReviewStage(reviewStageData);
    setShowDeleteConfirm(true);
  };

  /**
   * After confirming deletion, deletes the
   * event submission review stage.
   */
  const onConfirmDelete = async () => {
    try {
      const data = await api({
        headers,
        method: "DELETE",
        url: interpolatePath(apiPaths.EVT_SUBMISSION_REVIEW_STAGE, {
          headers,
          eventId: event?.id,
          submissionId: submission?.id,
          reviewStageId: activeReviewStage?.id,
        }),
      });

      addToast(
        t("common.notifs.successfullyDeleted", {
          entityName: activeReviewStage?.name,
          entity: t("common.reviewStage", { entries: 1 }),
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
          entityName: activeReviewStage?.name,
          entity: t("common.reviewStage", { entries: 1 }),
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
        title={t("common.reviewStage", { entries: 2 })}
        toolbar={pageHeaderToolbar}
      />
      {isReviewStageModalOpen && (
        <EventReviewStagesModal
          defaultValues={activeReviewStage}
          isShow={isReviewStageModalOpen}
          isSaving={isSaving}
          onSubmit={onSubmit}
          onHide={() => setReviewStageModalOpen(false)}
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
            setActiveReviewStage();
            setShowDeleteConfirm(false);
          }}
        >
          {t("common.alerts.areYouSureToDelete", {
            entityName: activeReviewStage?.name,
            entity: t("common.reviewStage", { entries: 1 }),
          })}
        </PopupAlert>
      )}
      <Panel
        title={t("common.reviewStage", { entries: 2 })}
        maximizable
        className="mt-4"
        color="inverse"
      >
        <EventsReviewStagesTable
          items={stages}
          onDelete={handleReviewStageDelete}
          onEdit={handleReviewStageEdit}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);
      const urlQueryString = queryString.stringify({
        ...context.query,
        page: context.query.page || 1,
      });

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
            query: {
              ...context.query,
              page: context.query.page || 1,
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
            meta: reviewStagesResponse.data.meta,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

EventSubmissionReviewStagesPage.authorized = true;
EventSubmissionReviewStagesPage.allowedRoles = [ADMIN];
EventSubmissionReviewStagesPage.Layout = ViewEventSubmissionLayout;
EventSubmissionReviewStagesPage.defaultProps = {
  reviews: [],
};

export default EventSubmissionReviewStagesPage;
