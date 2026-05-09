<template>
  <div class="vod-param-cap" :class="{ 'vod-param-cap--expanded': paramsExpanded }">
    <Playground
      :url="url"
      :method="method"
      :data="data"
      :headers="headers"
      :servers="servers"
      :content-type="contentType"
      :body="body"
      dense
      @before-send="emit('before-send', $event)"
      @request-start="emit('request-start', $event)"
      @request-success="emit('request-success', $event)"
      @request-error="emit('request-error', $event)"
    >
      <template #send-button="{ loading, execute, abort, streaming }">
        <button
          v-if="data.length > paramsLimit"
          type="button"
          class="vod-param-cap__toggle"
          :data-expanded="paramsExpanded"
          @click="paramsExpanded = !paramsExpanded"
        >
          {{ paramsExpanded ? 'Show fewer' : `Show all ${data.length} fields` }}
        </button>
        <div class="vod-param-cap__send">
          <button
            v-if="streaming"
            type="button"
            class="vap-btn vap-btn--primary"
            aria-label="Stop request"
            @click="abort && abort()"
          >
            Stop
          </button>
          <button
            v-else
            type="button"
            class="vap-btn vap-btn--primary"
            :disabled="loading"
            aria-label="Send request"
            @click="execute()"
          >
            <span v-if="loading" class="vap-spinner" />
            {{ loading ? 'Sending' : 'Send request' }}
          </button>
        </div>
      </template>
    </Playground>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Playground } from 'vue-api-playground'
import type {
  PlaygroundContentType,
  PlaygroundDataItem,
  RequestErrorPayload,
  RequestStartPayload,
  RequestSuccessPayload,
} from 'vue-api-playground'

interface Props {
  url: string
  method: string
  data: PlaygroundDataItem[]
  headers?: Record<string, string>
  servers?: string[]
  contentType?: PlaygroundContentType
  body?: string
  paramsLimit: number
}

withDefaults(defineProps<Props>(), {
  headers: undefined,
  servers: () => [],
  contentType: undefined,
  body: undefined,
})

const emit = defineEmits<{
  'before-send': [payload: { url: string; init: RequestInit }]
  'request-start': [payload: RequestStartPayload]
  'request-success': [payload: RequestSuccessPayload]
  'request-error': [payload: RequestErrorPayload]
}>()

const paramsExpanded = ref(false)
</script>
