import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import SubmissionCategorisationForm from "@/components/forms/SubmissionCategorisationForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import some from "lodash/some";

const SubmissionCategorisationPage = ({
  userSubmission,
  submission,
  presentationTypes,
  categories,
  headers,
  event,
}) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const methods = useForm({
    defaultValues: {
      terms_and_conditions: userSubmission?.terms_and_conditions,
      publish_consent: userSubmission?.publish,
      presentation_types: userSubmission?.presentation_types,
      category: userSubmission?.category,
    },
  });
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();

  const handleSubmit = async (params, { redirectToNextStep }) => {
    const requestParams = requestParamBuilder(params);

    try {
      const userSubmissionResponse = await api({
        headers,
        method: "PUT",
        data: {
          ...requestParams,
          presentation_types:
            requestParams?.presentation_types?.length > 0
              ? requestParams?.presentation_types
              : [],
          category:
            requestParams?.category?.length > 0 ? requestParams?.category : [],
        },
        url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
          eventId: router.query.eventId,
          submissionId: router.query.submissionId,
          userSubmissionId: userSubmission.id,
        }),
      });

      redirectToNextStep({
        query: {
          userSubmissionId: userSubmissionResponse.data.data.id,
        },
      });
    } catch (e) {
      addToast(
        t("common.notifs.failedToCreate", {
          entityName: t("common.userSubmission", { entries: 1 }),
          entity: "",
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <FormProvider {...methods}>
      <Wizard
        {...{ steps }}
        onPrevious={({ redirectToPreviousStep }) => {
          redirectToPreviousStep({
            query: { userSubmissionId: userSubmission?.id },
          });
        }}
        disableNext={methods.watch()}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) => {
            methods.clearErrors();
            if (
              !params?.presentation_types ||
              params?.presentation_types?.length <= 0
            ) {
              methods.setError("presentation_types", {
                type: "custom",
                message: "required",
              });
              return false;
            }

            if (!params?.category || params?.category?.length <= 0) {
              methods.setError("category", {
                type: "custom",
                message: "required",
              });
              return false;
            }

            handleSubmit(params, { redirectToNextStep });
          })()
        }
      >
        <SubmissionCategorisationForm {...{ presentationTypes, categories }} />
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const submissionPresentationTypesResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSION_PRESENTATION_TYPES, {
            eventId: context.query.eventId,
            submissionId: context.query.submissionId,
          }),
        });

        const submissionCategoriesResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_SUBMISSION_CATEGORIES, {
            eventId: context.query.eventId,
            submissionId: context.query.submissionId,
          }),
        });

        if (context.query.userSubmissionId) {
          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
              query: {
                include: "userSubmissionUser,authors,authors.affiliations",
              },
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              presentationTypes: submissionPresentationTypesResponse.data.data,
              categories: submissionCategoriesResponse.data.data,
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          props: {
            headers,
            session,
            context: await getContextProps(context),
            presentationTypes: submissionPresentationTypesResponse.data.data,
            categories: submissionCategoriesResponse.data.data,
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

SubmissionCategorisationPage.authorized = true;
SubmissionCategorisationPage.Layout = DashboardLayout;

export default SubmissionCategorisationPage;
