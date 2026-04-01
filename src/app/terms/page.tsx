export default function TermsPage() {
  return (
    <main className="max-w-lg mx-auto px-6 pt-8 pb-28">
      <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
        이용약관
      </h1>
      <p className="text-sm mb-8" style={{ color: '#58413d' }}>최종 수정일: 2026년 4월 1일</p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#201a16' }}>
        <section>
          <h2 className="font-bold text-base mb-2">제1조 (목적)</h2>
          <p>
            본 약관은 인정협회(이하 "서비스")가 제공하는 서비스 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제2조 (서비스 이용)</h2>
          <p>
            서비스는 이용자가 주장을 게시하고 다른 이용자들이 인정 또는 노인정으로 투표할 수 있는 커뮤니티 플랫폼입니다.
            소셜 로그인(카카오, 구글)을 통해 가입 및 이용이 가능합니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제3조 (이용자 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>타인을 비방하거나 혐오를 조장하는 내용을 게시하지 않습니다.</li>
            <li>허위 사실을 게시하지 않습니다.</li>
            <li>타인의 개인정보를 무단으로 게시하지 않습니다.</li>
            <li>광고, 스팸성 게시물을 작성하지 않습니다.</li>
            <li>서비스의 정상적인 운영을 방해하는 행위를 하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제4조 (게시물 관리)</h2>
          <p>
            서비스는 이용약관에 위반되는 게시물을 사전 통보 없이 삭제하거나 이용을 제한할 수 있습니다.
            이용자가 작성한 게시물의 책임은 이용자 본인에게 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제5조 (서비스 변경 및 중단)</h2>
          <p>
            서비스는 운영상, 기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
            서비스 중단 시 사전에 공지하며, 불가피한 경우 사후 공지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제6조 (면책조항)</h2>
          <p>
            서비스는 이용자가 게시한 내용에 대해 책임을 지지 않습니다.
            서비스 이용으로 발생한 분쟁은 이용자 간에 해결해야 하며, 서비스는 이에 개입하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">제7조 (약관 변경)</h2>
          <p>
            서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 안내합니다.
            변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
