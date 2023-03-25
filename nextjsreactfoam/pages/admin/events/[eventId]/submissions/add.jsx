import { useState, useEffect } from "react";
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
import { ABSTRACTS } from "@/constants/submissionTypes";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import isPlainObject from "lodash/isPlainObject";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import paramsSanitizer from "@/utils/paramsSanitizer";
import formatISO from "date-fns/formatISO";

const AddSubmission = ({ event, session }) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isShowPresTypeModal, setShowPresTypeModal] = useState(false);
  const [isShowCategoryModal, setShowCategoryModal] = useState(false);
  const [activePresentationType, setActivePresentationType] = useState();
  const [activeCategory, setActiveCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [isSaving, setSaving] = useState(false);
  const [presentationTypes, setPresentationTypes] = useState([]);

  const methods = useForm({
    defaultValues: {
      enable_authors: false,
      enable_categories: false,
      enable_content: false,
      enable_introduction: false,
      enable_presentation_types: false,
      enable_title: false,
      require_conflicts: false,
      max_user_submission: 0,
      hide_submission_date: false,
      hidden: false,
      type: ABSTRACTS,
      ask_publish_question: false,
      title_word_limit: 0,
      disable_references: false,
      word_limit: 300,
      publish_consent: t("common.forms.defaultValues.publishConsent"),
      title_text: t("common.forms.defaultValues.titleText"),
      author_text: t("common.forms.defaultValues.authorText"),
      submit_text: t("common.forms.defaultValues.submitText"),
      introduction_text: t("common.forms.defaultValues.introductionText"),
      conflict_text: t("common.forms.defaultValues.conflictsText"),
      terms_and_conditions_question: t(
        "common.forms.defaultValues.termsConditionsQuestion"
      ),
    },
  });

  const eventDispatch = useEventDispatch();
  const watchEnableCategories = methods.watch("enable_categories", false);
  const watchEnablePresentationTypes = methods.watch(
    "enable_presentation_types",
    false
  );

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
        formData.append(key, value.value);
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
      /**
       * Request for a duplicate with a provided event ID
       * from the defaultValues passed into the modal.
       */
      const response = await api({
        url: `/events/${event?.id}/submissions`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      });

      router.push({
        pathname: paths.ADMIN_EVT_SUBMISSIONS_DASHBOARD,
        query: { eventId: event.id, submissionId: response.data.data.id },
      });
    } catch (e) {
      addToast("Failed to add submission.", {
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
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.createEntity", {
          entity: t("common.submission", { entries: 1 }),
        })}
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
        publish: params.publish && params.publish.value,
        sub_category_name:
          params.sub_category_name &&
          params.sub_category_name.map((sub) => sub.value),
        [keyName]: key,
      };
      setCategories(categories);
    } else {
      setCategories([
        ...categories,
        {
          ...params,
          publish: params.publish && params.publish.value,
          sub_category_name:
            params.sub_category_name &&
            params.sub_category_name.map((sub) => sub.value),
          uuid: uniqueId("cat_"),
        },
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
    <>
      <PageHeader title="Setup" toolbar={pageHeaderToolbar} />
      {isShowPresTypeModal && (
        <EventSubmissionPresentationTypeModal
          isShow={isShowPresTypeModal}
          onHide={() => setShowPresTypeModal(false)}
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

AddSubmission.authorized = true;
AddSubmission.allowedRoles = [ADMIN];
AddSubmission.Layout = ViewEventLayout;

export default AddSubmission;
