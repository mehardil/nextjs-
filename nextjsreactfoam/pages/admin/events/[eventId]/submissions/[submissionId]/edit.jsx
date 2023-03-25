import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import uniqueId from "lodash/uniqueId";
import PageHeader from "@/components/common/PageHeader";
import EventSubmissionGeneralForm from "@/components/forms/EventSubmissionGeneralForm";
import EventSubmissionIntroTermConditionsForm from "@/components/forms/EventSubmissionIntroTermConditionsForm";
import EventSubmissionPresentationTypesForm from "@/components/forms/EventSubmissionPresentationTypesForm";
import EventSubmissionCategoriesForm from "@/components/forms/EventSubmissionCategoriesForm";
import EventSubmissionTitleForm from "@/components/forms/EventSubmissionTitleForm";
import EventSubmissionAuthorForm from "@/components/forms/EventSubmissionAuthorForm";
import EventSubmissionContentForm from "@/components/forms/EventSubmissionContentForm";
import EventSubmissionConflictForm from "@/components/forms/EventSubmissionConflictForm";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import EventSubmissionCategoryModal from "@/components/modals/EventSubmissionCategoryModal";
import EventSubmissionPresentationTypeModal from "@/components/modals/EventSubmissionPresentationTypeModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { ADMIN } from "@/constants/roles";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import isPlainObject from "lodash/isPlainObject";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import paramsSanitizer from "@/utils/paramsSanitizer";
import formatISO from "date-fns/formatISO";

const EditSubmission = ({ event, session, submission }) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isShowPresTypeModal, setShowPresTypeModal] = useState(false);
  const [isShowCategoryModal, setShowCategoryModal] = useState(false);
  const [activePresentationType, setActivePresentationType] = useState();
  const [activeCategory, setActiveCategory] = useState();
  const [categories, setCategories] = useState(
    submission?.categories ? submission?.categories : []
  );
  const [isSaving, setSaving] = useState(false);
  const [presentationTypes, setPresentationTypes] = useState(
    submission?.submission_types ? submission?.submission_types : []
  );
  const methods = useForm({
    defaultValues: {
      ...submission,
      disabled_references: submission?.disabled_references
        ? { label: "Yes", value: true }
        : { label: "No", value: false },
      max_user_submission:
        (submission?.max_user_submissions && {
          label: submission?.max_user_submissions,
          value: submission?.max_user_submissions,
        }) ||
        (submission?.max_user_submissions === 0 && {
          label: "No Limit",
          value: "No Limit",
        }) ||
        undefined,
      hidden: submission?.hidden
        ? { label: "Yes", value: true }
        : { label: "No", value: false },
      hide_submission_date: submission?.hide_submission_date
        ? { label: "Yes", value: true }
        : { label: "No", value: false },
      submission_open_date: submission?.submission_open_date
        ? new Date(submission?.submission_open_date)
        : undefined,
    },
  });

  const eventDispatch = useEventDispatch();
  const watchEnableCategories = methods.watch("enable_categories", false);
  const watchEnablePresentationTypes = methods.watch(
    "enable_presentation_types",
    false
  );

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

  const handleSubmit = async (params) => {
    setSaving(true);
    const formData = new FormData();

    if (params?.submission_open_date) {
      params.submission_open_date = formatISO(params?.submission_open_date);
    }

    for (const [key, value] of Object.entries(paramsSanitizer(params))) {
      /**
       * Check if its a select field's label-value pair object prop.
       * If it is, extract its value.
       */
      if (isPlainObject(value)) {
        if (key == "admin" && value?.id) {
          formData.append(key, value.id);
        } else {
          formData.append(key, value.value);
        }
      } else {
        formData.append(key, value);
      }
    }

    if (watchEnablePresentationTypes) {
      presentationTypes.forEach((presType, index) => {
        for (const [key, value] of Object.entries(paramsSanitizer(presType))) {
          formData.append(`presentation_types[${index}][${key}]`, value);
        }
      });
    }

    if (watchEnableCategories) {
      categories.forEach((category, index) => {
        for (const [key, value] of Object.entries(paramsSanitizer(category))) {
          formData.append(`categories[${index}][${key}]`, value);
        }
      });
    }

    try {
      await api({
        url: `/events/${event?.id}/submissions/${submission?.id}`,
        method: "post",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      });

      addToast("Submission successfully updated.", {
        appearance: "success",
        autoDismiss: true,
      });

      router.replace(router.asPath);
    } catch (e) {
      addToast("Failed to update submission.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <>
      <Button
        color="secondary"
        className="mr-1"
        disabled={isSaving}
        onClick={() => {
          methods.reset();
          router.reload(window.location.ADMIN_EVT_SUBMISSIONS_ADD);
        }}
        isCircle
      >
        {t("common.forms.reset")}
      </Button>
      <Button
        color="primary"
        onClick={() => methods.handleSubmit(handleSubmit)()}
        isLoading={isSaving}
        isCircle
      >
        <Icon icon="save" type="far" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </>
  );

  const handleSubmitPresentationType = (params) => {
    /**
     * If a pre-populated or an existing item has been updated,
     * replace it on the current list of presntation types. Uses
     * either the "key" or "id" property.
     */
    if (activePresentationType) {
      const keyName = activePresentationType?.id ? "id" : "key";
      const key = activePresentationType?.id || activePresentationType?.key;
      const indexOfUpdated = presentationTypes.findIndex(
        (pt) => pt?.key == key || pt?.id == key
      );
      presentationTypes[indexOfUpdated] = { ...params, [keyName]: key };
      setPresentationTypes(presentationTypes);

      /**
       * Or else, just appends it on the list, which means
       * its a new resource.
       */
    } else {
      setPresentationTypes([...presentationTypes, params]);
    }

    setShowPresTypeModal(false);
    setActivePresentationType(undefined);
  };

  const handleSubmitCategory = (params) => {
    if (activeCategory) {
      const keyName = activeCategory?.id ? "id" : "uuid";
      const key = activeCategory[keyName];
      const indexOfUpdated = categories.findIndex(
        (cat) => cat[keyName] == key || cat?.id == key
      );
      categories[indexOfUpdated] = {
        ...params,
        sub_category_name:
          params.sub_category_name &&
          params.sub_category_name.map((sub) => sub.value),
        publish: params.publish && params.publish.value,
        [keyName]: key,
      };
      setCategories(categories);
    } else {
      setCategories([
        {
          ...params,
          sub_category_name:
            params.sub_category_name &&
            params.sub_category_name.map((sub) => sub.value),
          publish: params.publish && params.publish.value,
          uuid: uniqueId("cat_"),
        },
        ...categories,
      ]);
    }

    setShowCategoryModal(false);
    setActiveCategory(undefined);
  };

  const presentationTypePanelToolbar = (
    <Button
      color="success"
      size="xs"
      onClick={() => setShowPresTypeModal(true)}
      disabled={!watchEnablePresentationTypes || isSaving}
    >
      Add Presentation Type
    </Button>
  );

  const categoryPanelToolbar = (
    <Button
      color="success"
      size="xs"
      onClick={() => setShowCategoryModal(true)}
      disabled={!watchEnableCategories || isSaving}
    >
      Add Category
    </Button>
  );

  return (
    <>
      <PageHeader title="Edit Submission" toolbar={pageHeaderToolbar} />
      {isShowPresTypeModal && (
        <EventSubmissionPresentationTypeModal
          isEditing={activePresentationType}
          isShow={isShowPresTypeModal}
          onHide={() => {
            setActivePresentationType(undefined);
            setShowPresTypeModal(false);
          }}
          defaultValues={activePresentationType}
          onSubmit={handleSubmitPresentationType}
        />
      )}
      {isShowCategoryModal && (
        <EventSubmissionCategoryModal
          isEditing={activeCategory}
          isShow={isShowCategoryModal}
          onHide={() => {
            setActiveCategory(undefined);
            setShowCategoryModal(false);
          }}
          defaultValues={activeCategory}
          onSubmit={handleSubmitCategory}
        />
      )}
      <FormProvider {...methods}>
        <form>
          <Panel
            title="General Details"
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionGeneralForm {...{ isSaving }} />
          </Panel>
          <Panel
            title={t("common.introTermsConditions")}
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionIntroTermConditionsForm {...{ isSaving }} />
          </Panel>
          <Panel
            title={t("common.presentationType", { entries: 2 })}
            color="inverse"
            toolbar={presentationTypePanelToolbar}
            maximizable
            collapsable
          >
            <EventSubmissionPresentationTypesForm
              isSaving={isSaving}
              presentationTypes={presentationTypes}
              onSelect={(presentationType) => {
                setActivePresentationType(presentationType);
                setShowPresTypeModal(true);
              }}
              onDelete={(presentationType) => {
                setPresentationTypes(
                  presentationTypes.filter((item) => item !== presentationType)
                );
              }}
            />
          </Panel>
          <Panel
            title={t("common.category", { entries: 2 })}
            color="inverse"
            toolbar={categoryPanelToolbar}
            maximizable
            collapsable
          >
            <EventSubmissionCategoriesForm
              isSaving={isSaving}
              categories={categories}
              onSelect={(category) => {
                setActiveCategory({
                  ...category,
                  sub_category_name: category.sub_category_name?.map((sub) => ({
                    label: sub,
                    value: sub,
                  })),
                });
                setShowCategoryModal(true);
              }}
              onDelete={(category) => {
                setCategories(categories.filter((item) => item !== category));
              }}
            />
          </Panel>
          <Panel
            title={t("common.forms.fields.title")}
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionTitleForm {...{ isSaving }} />
          </Panel>
          <Panel
            title={t("common.author", { entries: 2 })}
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionAuthorForm {...{ isSaving }} />
          </Panel>
          <Panel
            title={t("common.content", { entries: 1 })}
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionContentForm {...{ isSaving }} />
          </Panel>
          <Panel
            title={t("common.conflict", { entries: 1 })}
            color="inverse"
            maximizable
            collapsable
          >
            <EventSubmissionConflictForm {...{ isSaving }} />
          </Panel>
        </form>
      </FormProvider>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    /**
     * nextApi is a utility to make a request to the
     * nextJS API (not Currinda API). It is an instance with the
     * App URL as its baseURL.
     */
    const eventResponse = await api({
      url: `/events/${context.params.eventId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const submissionResponse = await api({
      url: `/events/${context.params.eventId}/submissions/${context.params.submissionId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        event: eventResponse.data.data,
        submission: submissionResponse.data.data,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {},
  };
};

EditSubmission.authorized = true;
EditSubmission.allowedRoles = [ADMIN];
EditSubmission.Layout = ViewEventLayout;

export default EditSubmission;
