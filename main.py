from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import time
import pandas as pd
from datetime import datetime
from selenium import webdriver
import signal
import sys

# 사용자 정보 업데이트
user_id = "bogi772@gmail.com"
user_pw = "webcash1!"

# 전역 변수로 결과 저장
results = []

def signal_handler(signum, frame):
    """Ctrl+C로 프로그램 중단 시 결과 저장"""
    print("\n🛑 프로그램이 중단되었습니다. 지금까지의 결과를 저장합니다...")
    save_results(results)
    sys.exit(0)

# Ctrl+C 시그널 핸들러 등록
signal.signal(signal.SIGINT, signal_handler)

def save_results(results):
    """결과를 엑셀 파일로 저장하는 함수"""
    if results:
        df = pd.DataFrame(results)
        current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'ai_chat_results_{current_time}.xlsx'
        
        try:
            # openpyxl이 있으면 Excel로 저장, 없으면 CSV로 저장
            df.to_excel(filename, index=False, engine='openpyxl')
            print(f"✅ 결과가 Excel 파일 '{filename}'로 저장되었습니다.")
        except ImportError:
            # openpyxl이 없는 경우 CSV로 저장
            csv_filename = f'ai_chat_results_{current_time}.csv'
            df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
            print(f"✅ 결과가 CSV 파일 '{csv_filename}'로 저장되었습니다.")
            print("💡 Excel 형식으로 저장하려면: pip install openpyxl")
        except Exception as e:
            # 기타 오류 시 CSV로 저장
            csv_filename = f'ai_chat_results_{current_time}.csv'
            df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
            print(f"⚠ Excel 저장 실패, CSV 파일 '{csv_filename}'로 저장되었습니다.")
            print(f"오류: {e}")
        
        return filename if results else None
    else:
        print("⚠ 저장할 결과가 없습니다.")
        return None


def click_latest_svg_button(driver):
    """동적으로 생성된 최신 SVG 버튼 클릭"""
    try:
        # **기존 팝업이 열려 있다면 닫기**
        driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
        time.sleep(1)

        # **동적 SVG 요소 찾기**
        svg_elements = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located(
                (By.XPATH, "//*[name()='svg'][@class='w-6 h-6 cursor-pointer text-gray-500' and @aria-expanded='false']")
            )
        )

        if svg_elements:
            last_svg = svg_elements[-1]  # 가장 마지막으로 생성된 버튼 선택

            # **SVG 요소의 부모 `<div>` 또는 `<button>` 찾기**
            svg_parent = last_svg.find_element(By.XPATH, "./parent::*")

            # **JavaScript 클릭 대신 ActionChains 사용**
            actions = ActionChains(driver)
            actions.move_to_element(svg_parent).click().perform()
            print("📌 최신 SVG 부모 버튼 클릭 완료")
            return True
        else:
            print("⚠ SVG 버튼을 찾을 수 없습니다.")
            return False

    except Exception as e:
        print(f"🚨 SVG 버튼 클릭 오류 발생: {e}")
        return False


def login_and_input_questions():
    questions = [
        "수시입출계좌 잔액은?",
        "예적금 잔액",
    ]

    driver = None

    try:
        driver = webdriver.Chrome()
        driver.get("https://cloudbranchq-dev.aiwebcash.co.kr/pc/login")

        # 로그인 요소 찾기 - HTML 구조에 맞게 수정
        username_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'][placeholder='아이디']"))
        )
        password_input = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password'][placeholder='비밀번호']"))
        )
        login_button = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        )

        # 기존 값 초기화 후 새로운 값 입력
        username_input.clear()
        username_input.send_keys(user_id)
        password_input.clear()
        password_input.send_keys(user_pw)
        login_button.click()

        time.sleep(3)

        for i, question in enumerate(questions, 1):
            try:
                print(f"질문 {i}/{len(questions)} 입력 시작: {question}")

                # **[1] 기존 팝업 닫기**
                driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                time.sleep(1)

                input_field = WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
                )

                # **[2] 입력 필드 강제 초기화 후 질문 입력**
                input_field.send_keys(Keys.CONTROL, 'a', Keys.BACKSPACE)
                input_field.send_keys(question)

                # **[3] 검색 버튼 클릭**
                search_button = driver.find_element(By.XPATH,
                                                    "//button[@type='submit']//div[@class='text-aicfo w-6 h-6']//*[name()='svg']")
                search_button.click()

                print(f"질문 {i}/{len(questions)} 입력 성공: {question}")

                # **[4] 응답이 화면에 나타날 때까지 대기**
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "text-black"))
                )
                print("✅ 응답 감지 완료")

                # **[5] 최신 SVG 버튼 클릭**
                if not click_latest_svg_button(driver):
                    print("🚨 최신 SVG 버튼 클릭 실패, 다음 질문으로 이동")
                    results.append({
                        'Question': question,
                        'Answer': "SVG 버튼 클릭 실패",
                        'SQL_Query': "",
                        'Date': "-"
                    })
                    # 중간 결과 저장
                    save_results(results)
                    continue

                # **[6] 팝업 열림 확인**
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located(
                            (By.XPATH, "//div[contains(@id, 'headlessui-popover-panel-') and contains(., '조회 기준 시점')]"))
                    )
                    print("✅ 조회 기준 시점 팝업 열림 감지 완료")
                except TimeoutException:
                    print("⚠ 조회 기준 시점 팝업이 열리지 않음")

                time.sleep(1)

                # **[7] 조회 기준 시점 데이터 가져오기**
                try:
                    date_element = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.XPATH, "//div[contains(text(), '조회 기준 시점')]"))
                    )
                    answer_date = driver.execute_script("return arguments[0].textContent;", date_element).strip()
                    print("📅 조회 기준 시점:", answer_date)
                except TimeoutException:
                    print("⚠ 조회 기준 시점 없음")
                    answer_date = "-"

                # **[8] 답변 텍스트 가져오기**
                answer_element = WebDriverWait(driver, 10).until(
                    EC.visibility_of_element_located((By.XPATH,
                                                      "//div[@class='flex text-base items-center min-h-10 pl-2']//div[@class='text-black']/span"))
                )
                answer_text = answer_element.text.strip() if answer_element else "답변 없음"

                # **[8-1] SQL Query 추출**
                sql_query = ""
                try:
                    # SQL Query 버튼 찾기
                    sql_button = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.XPATH, "//button[contains(., 'SQL Query')]"))
                    )
                    
                    if sql_button:
                        # SQL Query가 펼쳐져 있는지 확인 (aria-expanded="true")
                        if sql_button.get_attribute("aria-expanded") == "true":
                            # SQL Query 내용 추출
                            sql_code_element = WebDriverWait(driver, 3).until(
                                EC.presence_of_element_located((By.XPATH, 
                                    "//pre[@class='bg-gray-800 text-white p-4 rounded-lg overflow-x-auto']/code"))
                            )
                            sql_query = sql_code_element.text.strip() if sql_code_element else ""
                            print("📊 SQL Query 추출 완료")
                        else:
                            # JavaScript를 사용하여 SQL Query 버튼 클릭 (element click intercepted 오류 방지)
                            driver.execute_script("arguments[0].click();", sql_button)
                            time.sleep(2)  # 클릭 후 충분한 대기 시간
                            
                            # SQL Query 내용 추출
                            sql_code_element = WebDriverWait(driver, 5).until(
                                EC.presence_of_element_located((By.XPATH, 
                                    "//pre[@class='bg-gray-800 text-white p-4 rounded-lg overflow-x-auto']/code"))
                            )
                            sql_query = sql_code_element.text.strip() if sql_code_element else ""
                            print("📊 SQL Query 버튼 클릭 후 추출 완료")
                except TimeoutException:
                    print("⚠ SQL Query 버튼을 찾을 수 없습니다.")
                    sql_query = ""
                except Exception as e:
                    print(f"⚠ SQL Query 추출 실패: {e}")
                    sql_query = ""

                results.append({
                    'Question': question,
                    'Answer': answer_text,
                    'SQL_Query': sql_query,
                    'Date': answer_date
                })

                print(f"✅ 질문 {i}/{len(questions)} 처리 완료")
                if sql_query:
                    print(f"📊 SQL Query 길이: {len(sql_query)} 문자")

                # 매 10개 질문마다 중간 결과 저장
                if i % 10 == 0:
                    print(f"💾 중간 결과 저장 중... ({i}/{len(questions)})")
                    save_results(results)

                # **[9] 페이지 새로고침**
                driver.refresh()
                time.sleep(5)

            except KeyboardInterrupt:
                print("\n🛑 사용자가 프로그램을 중단했습니다.")
                print(f"지금까지 {len(results)}개의 질문이 처리되었습니다.")
                save_results(results)
                return
            except Exception as e:
                print(f"🚨 질문 '{question}' 처리 중 오류 발생: {e}")
                results.append({
                    'Question': question,
                    'Answer': f"오류 발생: {str(e)}",
                    'SQL_Query': "",
                    'Date': "-"
                })
                # 오류 발생 시에도 중간 결과 저장
                save_results(results)
                continue

    except KeyboardInterrupt:
        print("\n🛑 사용자가 프로그램을 중단했습니다.")
        print(f"지금까지 {len(results)}개의 질문이 처리되었습니다.")
        save_results(results)
    except Exception as e:
        print(f"🚨 프로그램 실행 중 오류 발생: {e}")
        save_results(results)

    finally:
        if driver:
            try:
                driver.quit()
                print("🌐 브라우저가 종료되었습니다.")
            except:
                pass
        
        if results:
            final_filename = save_results(results)
            if final_filename:
                print(f"📂 프로그램 종료. 최종 결과가 '{final_filename}'에 저장되었습니다.")
                print(f"📊 총 {len(results)}개의 질문이 처리되었습니다.")
        else:
            print("⚠ 저장된 결과가 없습니다.")

if __name__ == "__main__":
    print("🚀 AI 채팅 자동화 프로그램을 시작합니다...")
    print("💡 중간에 멈추려면 Ctrl+C를 누르세요.")
    print("💾 결과는 자동으로 저장됩니다.")
    login_and_input_questions()
